// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    proxy: {
      '/odoo': {
        target: 'http://localhost:8069',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/odoo/, ''),
        secure: false,
        ws: true
      }
    }
  }
});