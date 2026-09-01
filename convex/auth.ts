import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { username } from 'better-auth/plugins/username';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) throw new Error('SITE_URL is required');

  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [
      siteUrl,
      'http://127.0.0.1:3000',
      'http://localhost:3000',
    ],
    database: authComponent.adapter(ctx),
    disabledPaths: ['/is-username-available'],
    session: {
      // Cookie Max-Age cannot exceed 400 days. A one-year sliding session,
      // refreshed daily while the owner uses the app, keeps sign-in persistent
      // without making Better Auth reject the login response.
      expiresIn: 60 * 60 * 24 * 365,
      updateAge: 60 * 60 * 24,
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: process.env.ALLOW_OFFICIAL_SIGNUP !== 'true',
      requireEmailVerification: false,
      minPasswordLength: 4,
      maxPasswordLength: 128,
    },
    plugins: [
      username({
        minUsernameLength: 10,
        maxUsernameLength: 15,
      }),
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions);
};
