import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
    Html5Qrcode,
    Html5QrcodeScannerState,
    Html5QrcodeSupportedFormats,
    type CameraDevice,
} from "html5-qrcode";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scan } from "lucide-react";
import StatusBadge, { type ScannerStatus } from "./scanner/StatusBadge";
import ScannerView from "./scanner/ScannerView";
import ScannerControls from "./scanner/ScannerControls";

interface Props {
    onScanSuccess: (decodedText: string) => void;
    /** When true, camera is stopped (e.g. while scan result modal is open). */
    paused?: boolean;
}

const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
];

const NO_CODE_DETECTED = "No MultiFormat Readers were able to detect the code";

const SCAN_CONFIG = {
    fps: 10,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.max(160, Math.floor(minEdge * 0.7));
        return { width: size, height: size };
    },
};

export default function Scanner({ onScanSuccess, paused = false }: Props) {
    const rawId = useId();
    const containerId = `scanner-${rawId.replace(/:/g, "-")}`;

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const onScanRef = useRef(onScanSuccess);
    useEffect(() => {
        onScanRef.current = onScanSuccess;
    }, [onScanSuccess]);

    const generationRef = useRef(0);
    const lockRef = useRef<Promise<void>>(Promise.resolve());

    const [status, setStatus] = useState<ScannerStatus>("idle");
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

    const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

    const start = useCallback(
        (cameraId?: string): Promise<void> => {
            const myGen = ++generationRef.current;
            return enqueue(async () => {
                if (myGen !== generationRef.current) return;

                let scanner: Html5Qrcode | null = null;
                try {
                    setStatus("starting");
                    setError(null);

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
                        if (myGen !== generationRef.current) return;
                        setCameras(available);
                    }
                    if (available.length === 0) {
                        throw new Error("Nicio camera disponibila pe acest dispozitiv.");
                    }

                    const chosen =
                        cameraId ??
                        available.find((c) => /back|rear|environment/i.test(c.label))?.id ??
                        available[available.length - 1].id;

                    await scanner.start(
                        chosen,
                        SCAN_CONFIG,
                        (decodedText) => {
                            const now = Date.now();
                            const last = lastScannedRef.current;
                            if (last.code === decodedText && now - last.time < 3000) {
                                return;
                            }
                            lastScannedRef.current = { code: decodedText, time: now };
                            onScanRef.current(decodedText);
                        },
                        (errorMessage) => {
                            if (errorMessage.includes(NO_CODE_DETECTED)) return;
                        },
                    );

                    if (myGen !== generationRef.current) {
                        await scanner.stop().catch(() => {});
                        try {
                            scanner.clear();
                        } catch {
                        }
                        return;
                    }

                    scannerRef.current = scanner;
                    setActiveCameraId(chosen);
                    setStatus("scanning");
                } catch (err) {
                    if (scanner) {
                        try {
                            if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                                await scanner.stop().catch(() => {});
                            }
                            scanner.clear();
                        } catch {
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

    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    useEffect(() => {
        if (paused) stop();
    }, [paused, stop]);

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
                    <ScannerView
                        containerId={containerId}
                        status={status}
                        error={error}
                        onStart={() => start()}
                        onRetry={() => start()}
                    />

                    <ScannerControls
                        activeCameraLabel={activeCameraLabel}
                        hasMultipleCameras={cameras.length > 1}
                        onCycleCamera={cycleCamera}
                        isScanning={status === "scanning"}
                        onStop={stop}
                    />
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
