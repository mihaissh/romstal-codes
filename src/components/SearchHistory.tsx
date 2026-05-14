import { memo } from "react";
import { X, ArrowRight } from "lucide-react";
import type { Product } from "@/types/Product";
import type { HistoryItem } from "@/hooks/useSearchHistory";
import { Button } from "@/components/ui/button";

interface Props {
    history: Product[];
    historyItems: HistoryItem[];
    onSelectProduct: (product: Product) => void;
    onDeleteItem: (code: string) => void;
    onClearAll: () => void;
}

function SearchHistoryComponent({ history, historyItems, onSelectProduct, onDeleteItem, onClearAll }: Props) {
    if (history.length === 0) return null;

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const m = Math.floor(diff / 60000);
        if (m < 1) return "acum";
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h`;
        const d = Math.floor(h / 24);
        return `${d}z`;
    };

    return (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
                    Recente
                </span>
                <Button variant="ghost" size="xs" onClick={onClearAll} className="text-muted-foreground/50 hover:text-destructive text-[10px] font-mono tracking-wider uppercase">
                    Sterge
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {historyItems.map((item, i) => {
                    const p = item.product;
                    return (
                        <div
                            key={`${p.code}-${p.store}-${p.storage}`}
                            onClick={() => onSelectProduct(p)}
                            style={{ animationDelay: `${i * 40 + 200}ms` }}
                            className="group relative flex items-center gap-3 p-3.5 rounded-lg bg-card border border-border hover:border-primary/20 cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-primary/5 animate-entry"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteItem(p.code); }}
                                className="absolute top-2.5 right-2.5 p-0.5 rounded text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="size-3" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <code className="font-mono text-[11px] font-bold bg-tag-code-bg text-tag-code-text px-1.5 py-0.5 rounded">
                                        {p.code}
                                    </code>
                                    <span className="text-[10px] font-mono text-muted-foreground/40">{formatTime(item.timestamp)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate leading-relaxed">{p.name}</p>
                            </div>
                            <ArrowRight className="size-3.5 text-muted-foreground/15 group-hover:text-primary/60 shrink-0 transition-all group-hover:translate-x-0.5" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(SearchHistoryComponent);
