import { Minus, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/types/Product";
import { Button } from "@/components/ui/button";

export interface ScannedItem {
    product: Product;
    count: number;
}

interface ScannedListProps {
    items: ScannedItem[];
    onUpdateCount: (code: string, count: number) => void;
    onRemove: (code: string) => void;
}

export default function ScannedList({ items, onUpdateCount, onRemove }: ScannedListProps) {
    if (items.length === 0) return null;

    return (
        <div className="mt-6 space-y-3 animate-fade-up">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Produse Scanate ({items.length})
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
                            <p className="text-xs text-muted-foreground mt-1">
                                {product.value.toFixed(2)} LEI • Stoc: {product.stock} {product.unit}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => {
                                    if (count <= 1) {
                                        onRemove(product.code);
                                    } else {
                                        onUpdateCount(product.code, count - 1);
                                    }
                                }}
                            >
                                <Minus className="size-3" />
                            </Button>
                            <span className="w-8 text-center font-mono text-sm font-medium">
                                {count}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={() => onUpdateCount(product.code, count + 1)}
                            >
                                <Plus className="size-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
                                onClick={() => onRemove(product.code)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
