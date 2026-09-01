import { useEffect, useState, type ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react';
import { authClient } from './authClient';
import { StoreDataSyncGate } from './StoreDataSyncGate';
import { api } from '../../../convex/_generated/api';
import { UpdatePrompt } from '../components/UpdatePrompt';
import { APP_VERSION_CHANGED_EVENT } from '../update/appVersion';

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

function ReleaseUpdateGate() {
  const [availableVersion, setAvailableVersion] = useState<string>();

  useEffect(() => {
    const checkRemoteVersion = async () => {
      if (!convexClient || !navigator.onLine) return;
      try {
        setAvailableVersion(await convexClient.query(api.storeData.appReleaseVersion, {}));
      } catch (error) {
        console.info('Version check will become active after the update service is published.', error);
      }
    };
    const handleVersionChange = (event: Event) => {
      setAvailableVersion((event as CustomEvent<string>).detail);
    };
    const handleFocusOrOnline = () => void checkRemoteVersion();
    void checkRemoteVersion();
    const interval = window.setInterval(checkRemoteVersion, 5 * 60 * 1000);
    window.addEventListener(APP_VERSION_CHANGED_EVENT, handleVersionChange);
    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(APP_VERSION_CHANGED_EVENT, handleVersionChange);
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
    };
  }, []);

  return <UpdatePrompt availableVersion={availableVersion} />;
}

export function ConvexRoot({ children }: { children: ReactNode }) {
  if (!convexClient) return children;
  return (
    <ConvexBetterAuthProvider client={convexClient} authClient={authClient as unknown as AuthClient}>
      <StoreDataSyncGate>{children}</StoreDataSyncGate>
      <ReleaseUpdateGate />
    </ConvexBetterAuthProvider>
  );
}
