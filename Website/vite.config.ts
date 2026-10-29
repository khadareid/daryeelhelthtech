import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",

      // Keep SW off in Vite HMR to avoid stale-module issues; production builds still ship a full PWA.
      devOptions: {
        enabled: false,
      },

      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "logo.png",
        "maskable-icon-512x512.png",
        "masked-icon.png",
      ],

      manifest: {
        name: "Daryeel Health",
        short_name: "DaryeelHealth",
        description:
          "Patient health platform — find hospitals, book doctors, and manage care",
        theme_color: "#146AFB",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        id: "/",
        categories: ["health", "medical", "lifestyle"],
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },

      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

server: {
  host: true,
  port: 5173,
  strictPort: true,

  proxy: {
    "/api": {
      target:
        process.env.VITE_PROXY_TARGET || "http://localhost:5000",
      changeOrigin: true,
    },
  },
},

  base: "/",

  build: {
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.split("node_modules/")[1].split("/")[0];
          }
        },
      },
    },
  },
});