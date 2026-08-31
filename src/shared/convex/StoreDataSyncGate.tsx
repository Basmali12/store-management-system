import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useConvex, useConvexAuth, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { clearMerchantSession, getMerchantSession } from '../storage/session';
import { TENANT_DATA_KEYS, tenantStorageKey } from '../storage/tenantStorage';
import {
  acknowledgeStoreSyncOperations,
  getStoreSyncQueue,
  STORE_SYNC_EVENT,
} from './tenantSyncBridge';

type SyncState = 'offline' | 'pending' | 'syncing' | 'synced' | 'error';
const INITIALIZED_KEY = 'store_sync_initialized_v1';
const LAST_SYNC_KEY = 'store_last_sync_at';
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function StoreDataSyncGate({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const applyBatch = useMutation(api.storeData.applyBatch);
  const importInitial = useMutation(api.storeData.importInitial);
  const merchantId = getMerchantSession();
  const running = useRef(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [revision, setRevision] = useState(0);
  const [pendingCount, setPendingCount] = useState(() => getStoreSyncQueue().length);
  const [syncState, setSyncState] = useState<SyncState>(
    navigator.onLine ? (pendingCount ? 'pending' : 'synced') : 'offline',
  );

  const refreshQueueState = useCallback(() => {
    const count = getStoreSyncQueue().length;
    setPendingCount(count);
    if (!navigator.onLine) setSyncState('offline');
    else if (count) setSyncState('pending');
    setRevision(value => value + 1);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      refreshQueueState();
    };
    const handleOffline = () => {
      setOnline(false);
      setSyncState('offline');
    };
    const handleFocus = () => {
      const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
      if (Date.now() - lastSync >= REFRESH_INTERVAL) setRevision(value => value + 1);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    window.addEventListener(STORE_SYNC_EVENT, refreshQueueState);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener(STORE_SYNC_EVENT, refreshQueueState);
    };
  }, [refreshQueueState]);

  const synchronize = useCallback(async () => {
    if (running.current || !navigator.onLine || !isAuthenticated || !merchantId) return;
    running.current = true;
    setSyncState('syncing');
    try {
      const queued = getStoreSyncQueue();
      for (let index = 0; index < queued.length; index += 50) {
        const batch = queued.slice(index, index + 50);
        const result = await applyBatch({ operations: batch });
        acknowledgeStoreSyncOperations(result.acknowledgedIds);
      }

      const remoteRecords = await convex.query(api.storeData.list, {});
      const initialized = localStorage.getItem(INITIALIZED_KEY) === 'true';
      const latestPendingKeys = new Set(getStoreSyncQueue().map(operation => operation.key));

      if (!initialized && remoteRecords.length === 0) {
        const localRecords = TENANT_DATA_KEYS.flatMap(key => {
          const value = localStorage.getItem(tenantStorageKey(key, merchantId));
          return value === null ? [] : [{ key, value }];
        });
        if (localRecords.length) await importInitial({ records: localRecords });
      } else {
        const remoteKeys = new Set(remoteRecords.map(record => record.key));
        for (const key of TENANT_DATA_KEYS) {
          if (!latestPendingKeys.has(key) && !remoteKeys.has(key)) {
            localStorage.removeItem(tenantStorageKey(key, merchantId));
          }
        }
        for (const record of remoteRecords) {
          if (!latestPendingKeys.has(record.key)
            && (TENANT_DATA_KEYS as readonly string[]).includes(record.key)) {
            localStorage.setItem(tenantStorageKey(record.key, merchantId), record.value);
          }
        }
      }

      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
      const remaining = getStoreSyncQueue().length;
      setPendingCount(remaining);
      setSyncState(remaining ? 'pending' : 'synced');
    } catch (error) {
      console.error('Store synchronization failed', error);
      setPendingCount(getStoreSyncQueue().length);
      setSyncState(navigator.onLine ? 'error' : 'offline');
    } finally {
      running.current = false;
    }
  }, [applyBatch, convex, importInitial, isAuthenticated, merchantId]);

  useEffect(() => {
    if (online && isAuthenticated && merchantId) void synchronize();
  }, [isAuthenticated, merchantId, online, revision, synchronize]);

  useEffect(() => {
    // Losing connectivity never logs the owner out: cached data remains usable.
    // An expired server session is enforced only while the network is available.
    if (!isLoading && online && merchantId && !isAuthenticated) {
      clearMerchantSession();
      window.location.reload();
    }
  }, [isAuthenticated, isLoading, merchantId, online]);

  const labels: Record<SyncState, string> = {
    offline: 'أوفلاين — محفوظ محليًا',
    pending: `بانتظار المزامنة (${pendingCount})`,
    syncing: 'جاري المزامنة...',
    synced: 'متزامن',
    error: 'تعذر المزامنة — البيانات محفوظة',
  };

  return (
    <>
      {children}
      {merchantId && (
        <div
          className="fixed bottom-20 left-3 z-[100] rounded-full bg-slate-900/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg"
          dir="rtl"
          role="status"
        >
          {labels[syncState]}
        </div>
      )}
    </>
  );
}
