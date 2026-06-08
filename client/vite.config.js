import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // When the frontend calls "/api/...", forward it to the backend
    // so you don't run into cross-origin issues during development.
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
