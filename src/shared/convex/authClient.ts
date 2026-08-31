import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL?.trim()
  || convexUrl?.replace('.convex.cloud', '.convex.site');

export const isServerAuthConfigured = Boolean(convexUrl && convexSiteUrl);

export const authClient = createAuthClient({
  baseURL: convexSiteUrl || 'http://127.0.0.1:3000',
  plugins: [
    convexClient(),
    crossDomainClient(),
    usernameClient(),
  ],
});
