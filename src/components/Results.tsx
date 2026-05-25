import { useState, memo } from "react";
import { Copy, Check, X } from "lucide-react";
import type { Product } from "@/types/Product";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardAction,
    CardContent,
} from "@/components/ui/card";

import { parseMetaFromName } from "@/utils/productMetadata";

interface Props {
    product: Product;
    onClear: () => void;
}

function ResultsComponent({ product, onClear }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(product.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            return;
        }
    };

    type Tag = { label: string; cls: string };
    const tags: Tag[] = [];

    // Dynamically parse if DB metadata is empty
    const parsed = parseMetaFromName(product.name);
    const cat = product.category && product.category !== 'Altele' ? product.category : parsed.category;
    const mat = product.productMaterial || parsed.productMaterial;
    const col = product.color || parsed.color;
    const dims = (product.dimensions?.diameter || product.dimensions?.angle || product.dimensions?.threadSize)
        ? product.dimensions
        : parsed.dimensions;

    if (cat && cat !== 'Altele')
        tags.push({ label: cat, cls: "bg-tag-category-bg text-tag-category-text" });
    if (mat)
        tags.push({ label: mat, cls: "bg-tag-material-bg text-tag-material-text" });
    if (col)
        tags.push({ label: col, cls: "bg-tag-color-bg text-tag-color-text" });
    if (dims?.diameter)
        tags.push({ label: `⌀ ${dims.diameter}mm`, cls: "bg-tag-dimension-bg text-tag-dimension-text" });
    if (dims?.angle)
        tags.push({ label: `${dims.angle}°`, cls: "bg-tag-angle-bg text-tag-angle-text" });
    if (dims?.threadSize)
        dims.threadSize.forEach(t =>
            tags.push({ label: `${t}"`, cls: "bg-tag-thread-bg text-tag-thread-text" }));

    return (
        <Card className="animate-fade-up overflow-visible">
            <CardHeader className="pb-0">
                <CardTitle className="text-xl sm:text-2xl font-bold tracking-[-0.02em] leading-snug">
                    {product.name}
                </CardTitle>
                <CardAction>
                    <Button variant="outline" size="icon-sm" onClick={onClear} className="rounded-full bg-background/50 shadow-sm">
                        <X className="size-4" />
                    </Button>
                </CardAction>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-tag-code-bg rounded-lg px-5 py-3">
                        <span className="text-[9px] font-mono font-bold text-tag-code-text/50 uppercase tracking-[0.2em]">Cod</span>
                        <code className="font-mono text-xl font-extrabold text-tag-code-text tracking-wider">{product.code}</code>
                    </div>
                    <Button
                        variant="outline"
                        size="default"
                        onClick={handleCopy}
                        className={`gap-2 transition-all ${copied ? "border-chart-2/30 text-chart-2" : ""}`}
                    >
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        {copied ? "Copiat!" : "Copiaza"}
                    </Button>
                </div>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                style={{ animationDelay: `${i * 40 + 100}ms` }}
                                className={`inline-flex px-3 py-1.5 rounded-md text-xs font-semibold animate-entry ${tag.cls}`}
                            >
                                {tag.label}
                            </span>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <InfoBlock label="Depozitare" value={product.storage} sub={product.storageDesc} delay={200} />
                    <InfoBlock label="Magazin" value={product.store} sub={product.storeName} delay={260} />
                </div>
            </CardContent>
        </Card>
    );
}

function InfoBlock({ label, value, sub, delay }: { label: string; value: string; sub: string; delay: number }) {
    return (
        <div
            style={{ animationDelay: `${delay}ms` }}
            className="p-4 rounded-lg bg-muted/60 border border-border/50 animate-entry"
        >
            <p className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-base font-bold text-foreground tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
    );
}

export default memo(ResultsComponent);
