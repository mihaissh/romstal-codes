import { Trash2 } from "lucide-react";
import type { Product } from "@/types/Product";
import { Button } from "@/components/ui/button";

export interface ScannedItem {
    product: Product;
    count: number;
}

interface ScannedListProps {
    items: ScannedItem[];
    onRemove: (code: string) => void;
}

export default function ScannedList({ items, onRemove }: ScannedListProps) {
    if (items.length === 0) return null;

    return (
        <div className="mt-6 space-y-3 animate-fade-up">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Listă scanări ({items.length})
            </h3>
            <div className="space-y-3">
                {items.map(({ product, count }) => (
                    <div
                        key={product.code}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-primary">{product.code}</p>
                            <p className="truncate text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-mono tabular-nums">
                                Cantitate: {count}
                                {product.unit ? ` ${product.unit}` : ""}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onRemove(product.code)}
                            aria-label={`Elimină ${product.name}`}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
