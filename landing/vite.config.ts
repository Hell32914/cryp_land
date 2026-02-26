import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['@phosphor-icons/react'],
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
  },
  // Enable optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', '@phosphor-icons/react'],
    exclude: []
  },
  // Optimize dev server
  server: {
    hmr: {
      overlay: true
    }
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: [
      'website.syntrix.uno',
      'api.syntrix.uno',
      'admin.syntrix.uno',
      'appmini.syntrix.uno',
      'info.syntrixxx.site',
      'crypto.syntrixxx.site',
      'invest.syntrixxx.space',
      'invests.syntrixxx.space',
      'official.syntrixxx.space',
      'ss.syntrixxx.space',
      'road.syntrixxx.space',
      'ss.syntrixxx.website',
      'trade.syntrixxx.site',
      'trade.syntrixxx.website',
      'road.syntrixxx.website',
      '45.147.248.134',
      'localhost'
    ]
  }
});
