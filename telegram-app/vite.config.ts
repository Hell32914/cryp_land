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
      'syntrix.cc',
      'www.syntrix.cc',
      'api.syntrix.cc',
      'admin.syntrix.cc',
      'app.syntrix.cc',
      '45.147.248.134',
      'localhost'
    ]
  },
  base: '/'
})
