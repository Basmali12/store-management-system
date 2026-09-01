import type { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexBetterAuthProvider, type AuthClient } from '@convex-dev/better-auth/react';
import { authClient } from './authClient';
import { StoreDataSyncGate } from './StoreDataSyncGate';

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexRoot({ children }: { children: ReactNode }) {
  if (!convexClient) return children;
  return (
    <ConvexBetterAuthProvider client={convexClient} authClient={authClient as unknown as AuthClient}>
      <StoreDataSyncGate>{children}</StoreDataSyncGate>
    </ConvexBetterAuthProvider>
  );
}
