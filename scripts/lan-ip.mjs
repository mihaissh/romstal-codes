import os from "node:os";

/** First non-internal IPv4 (typical Wi‑Fi / Ethernet LAN address). */
export function getLanIp() {
    for (const ifaces of Object.values(os.networkInterfaces())) {
        if (!ifaces) continue;
        for (const iface of ifaces) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return undefined;
}
