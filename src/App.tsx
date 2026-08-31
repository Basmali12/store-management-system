/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect } from 'react';
import { AppRouter } from './navigation/app_router/AppRouter';
import { AppErrorBoundary } from './shared/components/AppErrorBoundary';
import { hardenLegacyMerchantAccounts } from './shared/auth/merchantAccounts';

export default function App() {
  useEffect(() => {
    void hardenLegacyMerchantAccounts();
    // Initialize theme
    const theme = localStorage.getItem('app_theme') || 'system';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  return <AppErrorBoundary><AppRouter /></AppErrorBoundary>;
}
