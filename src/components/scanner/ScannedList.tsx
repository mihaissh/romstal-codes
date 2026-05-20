import { useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import type { Product } from "@/types/Product";
import type { FilialaCode } from "@/types/filiala";
import { Button } from "@/components/ui/button";
import { exportScannedListXlsx } from "@/utils/exportScannedListXlsx";

export interface ScannedItem {
    product: Product;
    count: number;
}

interface ScannedListProps {
    items: ScannedItem[];
    store: FilialaCode;
    onRemove: (code: string) => void;
}

export default function ScannedList({ items, store, onRemove }: ScannedListProps) {
    const [exporting, setExporting] = useState(false);

    if (items.length === 0) return null;

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportScannedListXlsx(items, store);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="mt-6 space-y-3 animate-fade-up">
            <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Listă scanări ({items.length})
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-mono text-[11px] shrink-0"
                    disabled={exporting}
                    onClick={handleExport}
                >
                    {exporting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <Download className="size-3.5" />
                    )}
                    Export XLS
                </Button>
            </div>
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
