import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from "@tailwindcss/vite"
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    host: true
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
  },
  base: '/'
})
