import { Camera, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerControlsProps {
    activeCameraLabel: string;
    hasMultipleCameras: boolean;
    onCycleCamera: () => void;
    isScanning: boolean;
    onStop: () => void;
}

export default function ScannerControls({
    activeCameraLabel,
    hasMultipleCameras,
    onCycleCamera,
    isScanning,
    onStop,
}: ScannerControlsProps) {
    if (!isScanning) return null;

    return (
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
            <div className="flex shrink-0 items-center gap-2">
                {hasMultipleCameras && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCycleCamera}
                        className="gap-1.5"
                    >
                        <SwitchCamera className="size-3.5" />
                        <span className="text-[11px] font-mono uppercase tracking-wider">
                            Schimbă
                        </span>
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onStop}
                    className="gap-1.5 font-mono text-[11px] uppercase tracking-wider"
                >
                    Oprește
                </Button>
            </div>
        </div>
    );
}
