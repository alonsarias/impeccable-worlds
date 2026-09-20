import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { apiPlugin } from "./server/vite-plugin";

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    allowedHosts: [".trycloudflare.com"],
  },
});
