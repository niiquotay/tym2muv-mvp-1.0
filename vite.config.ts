import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      cors: {
        origin: true,
        credentials: true,
      },
      hmr: false,
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      cors: {
        origin: true,
        credentials: true,
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          constants: path.resolve(__dirname, 'constants.ts')
        },
        output: {
          entryFileNames: (assetInfo) => {
            if (assetInfo.name === 'constants') {
              return 'constants.js';
            }
            return 'assets/[name]-[hash].js';
          }
        }
      }
    }
  };
});
