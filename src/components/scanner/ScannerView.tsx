import { Loader2, CameraOff, RefreshCw, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScannerStatus } from "./StatusBadge";

interface ScannerViewProps {
    containerId: string;
    status: ScannerStatus;
    error: string | null;
    onStart: () => void;
    onRetry: () => void;
}

export default function ScannerView({ containerId, status, error, onStart, onRetry }: ScannerViewProps) {
    return (
        <div className="relative w-full overflow-hidden bg-black">
            <div
                id={containerId}
                className="min-h-[280px] w-full [&_video]:block [&_video]:w-full"
            />

            {status === "idle" && !error && (
                <Overlay>
                    <Scan className="size-10 text-primary" />
                    <p className="text-[11px] font-mono uppercase tracking-widest text-white/80">
                        Camera oprită
                    </p>
                    <Button
                        variant="default"
                        size="lg"
                        onClick={onStart}
                        className="mt-1 gap-2 font-mono"
                    >
                        <Scan className="size-4" />
                        Începe scanarea
                    </Button>
                </Overlay>
            )}

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
                    onClick={onRetry}
                    className="mt-1 gap-1.5"
                >
                    <RefreshCw className="size-3.5" /> Reincearca
                </Button>
            </Overlay>}
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
