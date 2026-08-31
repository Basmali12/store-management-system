import type { ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexRoot({ children }: { children: ReactNode }) {
  if (!convexClient) return children;
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
