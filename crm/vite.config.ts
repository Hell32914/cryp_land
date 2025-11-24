import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

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
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
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
  }
});
