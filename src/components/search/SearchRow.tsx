import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/Product";

interface RowProps {
    product: Product;
    isSelected: boolean;
    onClick: () => void;
    highlight: (text: string) => React.ReactNode;
    meta: { label: string; cls: string }[];
    index: number;
}

export const SearchRow = memo(function SearchRow({ product, isSelected, onClick, highlight, meta, index }: RowProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(product.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { }
    };

    return (
        <div
            data-item
            onClick={onClick}
            style={{ animationDelay: `${index * 25}ms` }}
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors duration-100 animate-entry ${
                isSelected ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
        >
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground leading-snug overflow-x-auto whitespace-nowrap scrollbar-none">
                    {highlight(product.name)}
                </div>
                {meta.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {meta.slice(0, 5).map((m, i) => (
                            <span key={i} className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none ${m.cls}`}>
                                {m.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <code className="flex-shrink-0 font-mono text-[11px] font-bold bg-tag-code-bg text-tag-code-text px-2 py-1 rounded">
                {product.code}
            </code>
            <Button
                variant="ghost"
                size="xs"
                onClick={handleCopy}
                className={`font-mono text-[10px] tracking-wider ${copied ? "text-chart-2" : "text-muted-foreground/50 hover:text-foreground"}`}
            >
                {copied ? 'OK!' : 'COPY'}
            </Button>
        </div>
    );
});
