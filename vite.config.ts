import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const versionFile = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'public/version.json'), 'utf8')) as { version?: unknown };
  if (typeof versionFile.version !== 'string' || !/^\d+(?:\.\d+){0,2}$/.test(versionFile.version)) {
    throw new Error('public/version.json must contain a valid numeric version');
  }
  return {
    base: process.env.VITE_PUBLIC_BASE || '/',
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(versionFile.version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            icons: ['lucide-react'],
            motion: ['motion'],
          },
        },
      },
    },
  };
});
