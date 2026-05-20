/// <reference types="vitest" />
import path from "path";
import os from "node:os";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const SKIP_IFACE = /virtual|vethernet|vmware|hyper-v|wsl|docker|loopback|bluetooth/i;
const PREFER_IFACE = /wi-?fi|wlan|wireless|ethernet|eth/i;

function getLanIp(): string | undefined {
    const candidates: { name: string; address: string; preferred: boolean }[] = [];

    for (const [name, ifaces] of Object.entries(os.networkInterfaces())) {
        if (!ifaces || SKIP_IFACE.test(name)) continue;
        for (const iface of ifaces) {
            if (iface.family !== "IPv4" || iface.internal) continue;
            candidates.push({
                name,
                address: iface.address,
                preferred: PREFER_IFACE.test(name),
            });
        }
    }

    const preferred = candidates.find((c) => c.preferred);
    return preferred?.address ?? candidates[0]?.address;
}

const lanIp = process.env.DEV_HMR_HOST ?? getLanIp();
const DEV_PORT = 5173;
const npmScript = process.env.npm_lifecycle_event ?? "";
const isPhoneDev = npmScript === "dev:phone";
const phoneHmrEnabled = npmScript === "dev:phone:hmr" || process.env.PHONE_HMR === "1";
const disableHmr = isPhoneDev && !phoneHmrEnabled;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() as any,
    {
      name: "print-phone-url",
      configureServer(server) {
        server.httpServer?.once("listening", () => {
          const addr = server.httpServer?.address();
          const port =
            typeof addr === "object" && addr && "port" in addr ? addr.port : DEV_PORT;
          const ip = lanIp ?? "YOUR_PC_IP";
          console.log(`\n  Phone (same Wi-Fi): http://${ip}:${port}/\n`);
          if (!lanIp) {
            console.log("  Set DEV_HMR_HOST or use ipconfig for your LAN IPv4.\n");
          }
          if (disableHmr && isPhoneDev) {
            console.log("  HMR disabled — refresh the page after code changes.\n");
          }
        });
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    port: DEV_PORT,
    strictPort: false,
    allowedHosts: true,
    hmr: disableHmr
      ? false
      : phoneHmrEnabled && lanIp
        ? {
            protocol: "ws",
            host: lanIp,
            port: DEV_PORT,
            clientPort: DEV_PORT,
          }
        : true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-dom") ||
              /node_modules[/\\]react[/\\]/.test(id)
            ) {
              return "vendor";
            }
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("html5-qrcode")) return "scanner";
            if (id.includes("xlsx")) return "xlsx";
          }
          if (id.includes("src/components/Scanner") || id.includes("src\\components\\Scanner")) {
            return "scanner";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
