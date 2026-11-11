import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: { proxy: { '/api': {target:`http://127.0.0.1:${process.env.FORJA_API_PORT||3001}`,changeOrigin:false} } },
  preview: { proxy: { '/api': {target:`http://127.0.0.1:${process.env.FORJA_API_PORT||3001}`,changeOrigin:false} } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["forja-f.svg", "forja-f-apple.png"],
      manifest: {
        name: "FORJA",
        short_name: "FORJA",
        description: "Sua evolução é construída.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#101416",
        theme_color: "#101416",
        icons: [
          {
            src: "/forja-f-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/forja-f-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/forja-f-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
