import { memo } from "react";
import type { Product } from "../types/Product";
import type { HistoryItem } from "../hooks/useSearchHistory";

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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Recente</span>
                <button onClick={onClearAll} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                    Sterge tot
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {historyItems.map((item) => {
                    const p = item.product;
                    return (
                        <div
                            key={p.code}
                            onClick={() => onSelectProduct(p)}
                            className="group relative flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border hover:border-border-hover cursor-pointer transition-all duration-150 hover:bg-surface-3"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteItem(p.code); }}
                                className="absolute top-2 right-2 p-1 rounded text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <code className="text-xs font-mono text-amber-400/80">{p.code}</code>
                                    <span className="text-[10px] text-zinc-700">{formatTime(item.timestamp)}</span>
                                </div>
                                <p className="text-xs text-zinc-400 truncate">{p.name}</p>
                            </div>
                            <svg className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(SearchHistoryComponent);
