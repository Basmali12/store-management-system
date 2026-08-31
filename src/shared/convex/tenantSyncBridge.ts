export interface StoreSyncOperation {
  id: string;
  key: string;
  value: string | null;
  queuedAt: number;
}

const QUEUE_KEY = 'store_sync_queue_v1';
export const STORE_SYNC_EVENT = 'store-sync-queue-changed';

const readQueue = (): StoreSyncOperation[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: StoreSyncOperation[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(STORE_SYNC_EVENT));
};

const enqueue = (key: string, value: string | null) => {
  const operation: StoreSyncOperation = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    key,
    value,
    queuedAt: Date.now(),
  };
  // Keep only the newest local state for each store section. This makes a long
  // offline editing session cost a single server write per changed section.
  writeQueue([...readQueue().filter(item => item.key !== key), operation]);
};

export const getStoreSyncQueue = () => readQueue();
export const queueStoreSet = (key: string, value: string) => enqueue(key, value);
export const queueStoreRemove = (key: string) => enqueue(key, null);

export const acknowledgeStoreSyncOperations = (ids: string[]) => {
  const acknowledged = new Set(ids);
  writeQueue(readQueue().filter(item => !acknowledged.has(item.id)));
};
