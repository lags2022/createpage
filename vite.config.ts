import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Habilita COOP/COEP para WebContainers en desarrollo
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      // Usamos credentialless para permitir recursos cross-origin como Google Fonts
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
});
