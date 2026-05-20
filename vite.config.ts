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
/** Phone/LAN scripts disable HMR by default (avoids ws:// LAN WebSocket errors). */
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
          console.log("\n  📱 On your phone (same Wi‑Fi), open:\n");
          console.log(`     http://${ip}:${port}/\n`);
          if (!lanIp) {
            console.log("     (Run ipconfig and use your Wi‑Fi IPv4 address.)\n");
          }
          if (disableHmr) {
            console.log("  HMR off for phone dev (no WebSocket errors). Refresh manually after edits.\n");
          } else if (isPhoneDev) {
            console.log(
              "  HMR on. If WebSocket fails on the phone, run as Administrator:\n" +
                "  npm run firewall:allow-dev\n" +
                "  or use npm run dev:phone (HMR off by default).\n",
            );
          }
        });
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    port: DEV_PORT,
    strictPort: false,
    // Allow opening dev server by LAN IP (e.g. http://192.168.1.138:5173)
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
