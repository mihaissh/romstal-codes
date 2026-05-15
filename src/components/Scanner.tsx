import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
    Html5Qrcode,
    Html5QrcodeScannerState,
    Html5QrcodeSupportedFormats,
    type CameraDevice,
} from "html5-qrcode";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scan, Loader2, Camera, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    onScanSuccess: (decodedText: string) => void;
}

type Status = "idle" | "starting" | "scanning" | "stopping" | "error";

const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
];

// Per-frame "no code in view" noise we don't want to surface as errors.
const NO_CODE_DETECTED = "No MultiFormat Readers were able to detect the code";

// Sizing the qrbox as a function of the actual viewfinder makes it scale
// with whatever aspect ratio the camera delivers, instead of being a fixed
// 250x250 box that drifts out of place on wide/tall webcams.
const SCAN_CONFIG = {
    fps: 10,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.max(160, Math.floor(minEdge * 0.7));
        return { width: size, height: size };
    },
};

export default function Scanner({ onScanSuccess }: Props) {
    // html5-qrcode mounts into an element looked up by id, so we need a
    // stable string id (not a ref). useId gives us one that is also unique
    // if multiple scanners ever coexist.
    const rawId = useId();
    const containerId = `scanner-${rawId.replace(/:/g, "-")}`;

    const scannerRef = useRef<Html5Qrcode | null>(null);
    // Keep the latest success callback in a ref so the scanner lifecycle
    // doesn't restart whenever the parent passes a new closure.
    const onScanRef = useRef(onScanSuccess);
    useEffect(() => {
        onScanRef.current = onScanSuccess;
    }, [onScanSuccess]);

    // Generation counter — bumped on every start/stop call. Any in-flight
    // async work checks its captured generation after each await and bails
    // if a newer operation has superseded it. This is what stops React
    // StrictMode (mount → unmount → mount) from producing two videos.
    const generationRef = useRef(0);
    // Serialization lock — chains start/stop so a teardown always finishes
    // before the next setup begins. Without it, scanner2.start() can inject
    // a <video> while scanner1.stop() is mid-flight and the cleanup of #1
    // ends up nuking #2's DOM.
    const lockRef = useRef<Promise<void>>(Promise.resolve());

    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [activeCameraId, setActiveCameraId] = useState<string | null>(null);

    const enqueue = useCallback((op: () => Promise<void>): Promise<void> => {
        const next = lockRef.current.catch(() => {}).then(op);
        lockRef.current = next.catch(() => {});
        return next;
    }, []);

    const stop = useCallback((): Promise<void> => {
        const myGen = ++generationRef.current;
        return enqueue(async () => {
            const scanner = scannerRef.current;
            scannerRef.current = null;
            if (!scanner) {
                if (myGen === generationRef.current) setStatus("idle");
                return;
            }
            if (myGen === generationRef.current) setStatus("stopping");
            try {
                if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                    await scanner.stop();
                }
                scanner.clear();
            } catch (err) {
                console.error("Scanner stop error", err);
            }
            if (myGen === generationRef.current) setStatus("idle");
        });
    }, [enqueue]);

    const start = useCallback(
        (cameraId?: string): Promise<void> => {
            const myGen = ++generationRef.current;
            return enqueue(async () => {
                // Superseded before we even got to run.
                if (myGen !== generationRef.current) return;

                let scanner: Html5Qrcode | null = null;
                try {
                    setStatus("starting");
                    setError(null);

                    // Tear down any leftover scanner inline (we already hold
                    // the lock, so calling stop() recursively would deadlock).
                    const existing = scannerRef.current;
                    scannerRef.current = null;
                    if (existing) {
                        try {
                            if (existing.getState() === Html5QrcodeScannerState.SCANNING) {
                                await existing.stop();
                            }
                            existing.clear();
                        } catch (err) {
                            console.error("Pre-start cleanup error", err);
                        }
                        if (myGen !== generationRef.current) return;
                    }

                    scanner = new Html5Qrcode(containerId, {
                        formatsToSupport: SUPPORTED_FORMATS,
                        verbose: false,
                    });

                    let available = cameras;
                    if (available.length === 0) {
                        available = await Html5Qrcode.getCameras();
                        // No DOM injected yet, safe to just drop the instance.
                        if (myGen !== generationRef.current) return;
                        setCameras(available);
                    }
                    if (available.length === 0) {
                        throw new Error("Nicio camera disponibila pe acest dispozitiv.");
                    }

                    // Prefer a rear-facing camera when no explicit one is requested.
                    const chosen =
                        cameraId ??
                        available.find((c) => /back|rear|environment/i.test(c.label))?.id ??
                        available[available.length - 1].id;

                    await scanner.start(
                        chosen,
                        SCAN_CONFIG,
                        (decodedText) => {
                            // Stop the camera first to free hardware, then forward.
                            stop().finally(() => onScanRef.current(decodedText));
                        },
                        (errorMessage) => {
                            if (errorMessage.includes(NO_CODE_DETECTED)) return;
                            // Per-frame decode failures are non-fatal; ignore.
                        },
                    );

                    // Superseded while the camera was warming up — undo it.
                    if (myGen !== generationRef.current) {
                        await scanner.stop().catch(() => {});
                        try {
                            scanner.clear();
                        } catch {
                            /* best effort */
                        }
                        return;
                    }

                    scannerRef.current = scanner;
                    setActiveCameraId(chosen);
                    setStatus("scanning");
                } catch (err) {
                    // Always try to clean up partially-initialized scanner.
                    if (scanner) {
                        try {
                            if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                                await scanner.stop().catch(() => {});
                            }
                            scanner.clear();
                        } catch {
                            /* best effort */
                        }
                    }
                    if (myGen !== generationRef.current) return;
                    scannerRef.current = null;
                    const message = err instanceof Error ? err.message : "Eroare necunoscuta.";
                    const isPermissionDenied = /permission|denied|notallowed/i.test(message);
                    setError(
                        isPermissionDenied
                            ? "Acces la camera refuzat. Permite accesul si reincearca."
                            : message,
                    );
                    setStatus("error");
                }
            });
        },
        [cameras, containerId, enqueue, stop],
    );

    // Auto-start on mount, cleanup on unmount.
    useEffect(() => {
        start();
        return () => {
            stop();
        };
        // We intentionally want this to run only on mount/unmount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cycleCamera = async () => {
        if (cameras.length < 2 || !activeCameraId) return;
        const idx = cameras.findIndex((c) => c.id === activeCameraId);
        const next = cameras[(idx + 1) % cameras.length];
        await start(next.id);
    };

    const activeCameraLabel = cameras.find((c) => c.id === activeCameraId)?.label ?? "—";

    return (
        <div className="space-y-4 animate-fade-up">
            <Card className="overflow-hidden border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-primary text-lg">
                            <Scan className="size-5" />
                            Scanare Cod Produs
                        </span>
                        <StatusBadge status={status} />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/*
                      Let html5-qrcode lay out its own video + shaded-region
                      overlay; we only provide a black backdrop and a min
                      height so loading/error overlays have somewhere to
                      paint before the stream is up.
                    */}
                    <div className="relative w-full overflow-hidden bg-black">
                        <div
                            id={containerId}
                            className="min-h-[280px] w-full [&_video]:block [&_video]:w-full"
                        />

                        {status === "starting" && <Overlay>
                            <Loader2 className="size-8 text-primary animate-spin" />
                            <p className="text-[11px] font-mono uppercase tracking-widest text-white/80">
                                Initializare camera...
                            </p>
                        </Overlay>}

                        {status === "stopping" && <Overlay>
                            <Loader2 className="size-8 text-muted-foreground animate-spin" />
                        </Overlay>}

                        {status === "error" && <Overlay>
                            <CameraOff className="size-10 text-destructive" />
                            <p className="max-w-[80%] text-center text-xs font-medium text-white">
                                {error}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => start()}
                                className="mt-1 gap-1.5"
                            >
                                <RefreshCw className="size-3.5" /> Reincearca
                            </Button>
                        </Overlay>}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/50 bg-muted/30 p-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Camera className="size-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                                    Camera
                                </p>
                                <p className="truncate text-xs font-medium">{activeCameraLabel}</p>
                            </div>
                        </div>
                        {cameras.length > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={cycleCamera}
                                disabled={status !== "scanning"}
                                className="shrink-0 gap-1.5"
                            >
                                <SwitchCamera className="size-3.5" />
                                <span className="text-[11px] font-mono uppercase tracking-wider">
                                    Schimba
                                </span>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
                <p className="text-[11px] italic leading-relaxed text-blue-600 dark:text-blue-400">
                    Sfat: Asigura-te ca exista suficienta lumina si ca eticheta este plana pentru o
                    scanare cat mai rapida.
                </p>
            </div>
        </div>
    );
}

function Overlay({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-[2px]">
            {children}
        </div>
    );
}

const STATUS_BADGE: Record<Status, { color: string; label: string; pulse: boolean }> = {
    idle: { color: "bg-muted text-muted-foreground", label: "Inactiv", pulse: false },
    starting: { color: "bg-amber-500/10 text-amber-600", label: "Pornire", pulse: true },
    scanning: { color: "bg-emerald-500/10 text-emerald-600", label: "Activ", pulse: true },
    stopping: { color: "bg-muted text-muted-foreground", label: "Oprire", pulse: false },
    error: { color: "bg-destructive/10 text-destructive", label: "Eroare", pulse: false },
};

function StatusBadge({ status }: { status: Status }) {
    const cfg = STATUS_BADGE[status];
    return (
        <span
            className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest",
                cfg.color,
            )}
        >
            <span className={cn("size-1.5 rounded-full bg-current", cfg.pulse && "animate-pulse")} />
            {cfg.label}
        </span>
    );
}
