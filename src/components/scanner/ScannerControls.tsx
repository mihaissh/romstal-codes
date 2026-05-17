import { Camera, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerControlsProps {
    activeCameraLabel: string;
    hasMultipleCameras: boolean;
    onCycleCamera: () => void;
    isScanning: boolean;
}

export default function ScannerControls({ 
    activeCameraLabel, 
    hasMultipleCameras, 
    onCycleCamera, 
    isScanning 
}: ScannerControlsProps) {
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
            {hasMultipleCameras && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCycleCamera}
                    disabled={!isScanning}
                    className="shrink-0 gap-1.5"
                >
                    <SwitchCamera className="size-3.5" />
                    <span className="text-[11px] font-mono uppercase tracking-wider">
                        Schimba
                    </span>
                </Button>
            )}
        </div>
    );
}
