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
      'syntrix.website',
      'www.syntrix.website',
      'api.syntrix.website',
      'admin.syntrix.website',
      'app.syntrix.website',
      '45.147.248.134',
      'localhost'
    ]
  },
  base: '/'
})
