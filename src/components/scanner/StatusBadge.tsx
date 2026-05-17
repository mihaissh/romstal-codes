import { cn } from "@/lib/utils";

export type ScannerStatus = "idle" | "starting" | "scanning" | "stopping" | "error";

const STATUS_BADGE: Record<ScannerStatus, { color: string; label: string; pulse: boolean }> = {
    idle: { color: "bg-muted text-muted-foreground", label: "Inactiv", pulse: false },
    starting: { color: "bg-amber-500/10 text-amber-600", label: "Pornire", pulse: true },
    scanning: { color: "bg-emerald-500/10 text-emerald-600", label: "Activ", pulse: true },
    stopping: { color: "bg-muted text-muted-foreground", label: "Oprire", pulse: false },
    error: { color: "bg-destructive/10 text-destructive", label: "Eroare", pulse: false },
};

export default function StatusBadge({ status }: { status: ScannerStatus }) {
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
