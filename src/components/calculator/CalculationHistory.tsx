import { Button } from "@/components/ui/button";
import { X, History } from "lucide-react";
import { formatAmount, formatLei, RESULT_CONFIG } from "@/utils/calculator";
import type { CalculationEntry } from "@/hooks/useCalculatorHistory";

interface HistoryProps {
    items: CalculationEntry[];
    onReuse: (entry: CalculationEntry) => void;
    onRemove: (id: string) => void;
    onClear: () => void;
}

export default function CalculationHistory({ items, onReuse, onRemove, onClear }: HistoryProps) {
    if (items.length === 0) return null;

    return (
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <History className="size-3.5 text-muted-foreground/70" />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase tracking-[0.15em]">
                        Istoric ({items.length})
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="xs"
                    onClick={onClear}
                    className="text-[10px] font-mono text-muted-foreground/60 hover:text-destructive tracking-wider uppercase transition-colors bg-background/50 shadow-sm"
                >
                    Sterge tot
                </Button>
            </div>

            <div className="rounded-xl border border-border bg-card/40 dark:bg-card/30 dark:backdrop-blur-sm overflow-hidden divide-y divide-border">
                {items.map((entry, i) => (
                    <HistoryRow
                        key={entry.id}
                        entry={entry}
                        index={i}
                        onReuse={() => onReuse(entry)}
                        onRemove={() => onRemove(entry.id)}
                    />
                ))}
            </div>
        </div>
    );
}

interface HistoryRowProps {
    entry: CalculationEntry;
    index: number;
    onReuse: () => void;
    onRemove: () => void;
}

function HistoryRow({ entry, index, onReuse, onRemove }: HistoryRowProps) {
    const c = RESULT_CONFIG[entry.kind];
    const displayAmount = Math.abs(entry.change);
    return (
        <div
            onClick={onReuse}
            style={{ animationDelay: `${index * 25}ms` }}
            className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors animate-entry"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${c.cls}`}>
                        {c.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
                        {new Date(entry.timestamp).toLocaleString("ro-RO", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-muted-foreground/70 tabular-nums truncate">
                    {formatAmount(entry.given)} − {formatAmount(entry.cost)} =
                </div>
            </div>
            <div className={`flex-shrink-0 text-sm font-bold tabular-nums ${c.valueCls}`}>
                {c.prefix}{formatLei(displayAmount)}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="flex-shrink-0 p-1.5 rounded-full border border-border bg-background/80 text-muted-foreground/40 hover:text-destructive hover:border-destructive/30 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                aria-label="Sterge"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}
