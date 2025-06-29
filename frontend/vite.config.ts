import { defineConfig, loadEnv } from 'vite';
import * as path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    root: 'src',
    publicDir: '../public',
    envPrefix: ['VITE_'],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@js': path.resolve(__dirname, 'src/js'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/js/utils'),
        '@images': path.resolve(__dirname, 'src/images')
      }
    },

    build: {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/index.html')
        }
      },
      chunkSizeWarningLimit: 1000,
      target: ['es2020']
    },

    server: {
      port: parseInt(env.VITE_DEV_PORT) || 5173,
      host: env.VITE_DEV_HOST || '0.0.0.0',
      open: env.VITE_AUTO_OPEN === 'true',
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:3001',
          ws: true,
          changeOrigin: true
        }
      },
      cors: {
        origin: ['http://localhost:3001', 'http://localhost:5173'],
        credentials: true
      }
    },

    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
      open: true,
      host: '0.0.0.0'
    },

    optimizeDeps: {
      include: [
        'crypto-js',
        'tslib'
      ]
    }
  };
});