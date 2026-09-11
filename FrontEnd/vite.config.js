import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Configuração do servidor de desenvolvimento
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },

  // Configuração de build
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    esbuild: {
      drop: ['console'],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }

          if (id.includes('node_modules/react')) {
            return 'vendor';
          }
        },
      },
    },
  },

  // Configuração de resolução
  resolve: {
    alias: {
      '@': '/src',
    },
  },

  // Configuração de enviroment
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
});
