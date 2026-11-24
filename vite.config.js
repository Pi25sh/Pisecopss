import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mumbai-3d-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/mumbai-3d' || req.url === '/mumbai-3d/') {
            req.url = '/mumbai-3d/index.html';
          }
          next();
        });
      }
    }
  ],
  root: '.',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    proxy: {
      '/mumbai-data': {
        target: 'https://mumbai-3d.easemyhood.workers.dev/d/05dfa6689f',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mumbai-data/, ''),
        secure: false
      }
    },
    watch: {
      ignored: ['**/*.fbx']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
