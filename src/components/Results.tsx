import { useState, memo } from "react";
import type { Product } from "../types/Product";

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
        } catch { /* noop */ }
    };

    const tags = [
        product.category !== 'Altele' ? product.category : null,
        product.productMaterial,
        product.color,
        product.dimensions?.diameter ? `⌀${product.dimensions.diameter}` : null,
        product.dimensions?.angle ? `${product.dimensions.angle}°` : null,
        ...(product.dimensions?.threadSize?.map(t => `${t}"`) || []),
    ].filter(Boolean);

    return (
        <div className="rounded-xl bg-surface-2 border border-border overflow-hidden animate-fade-up">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface">
                <span className="text-xs text-zinc-600 font-medium">Detalii produs</span>
                <button
                    onClick={onClear}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-surface-3"
                >
                    Inchide
                </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
                {/* Product name */}
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 leading-snug">
                    {product.name}
                </h2>

                {/* Code + Copy */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5">
                        <span className="text-xs text-zinc-500 font-medium">COD</span>
                        <code className="font-mono text-lg font-bold text-amber-400">{product.code}</code>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            copied
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-surface border border-border text-zinc-300 hover:bg-surface-3 hover:border-border-hover"
                        }`}
                    >
                        {copied ? "Copiat!" : "Copiaza"}
                    </button>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface border border-border text-zinc-400">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Info */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-surface border border-border">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-1">Depozitare</p>
                        <p className="text-sm text-zinc-300 font-medium">{product.storage}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{product.storageDesc}</p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-surface border border-border">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mb-1">Magazin</p>
                        <p className="text-sm text-zinc-300 font-medium">{product.store}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{product.storeName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ResultsComponent);
