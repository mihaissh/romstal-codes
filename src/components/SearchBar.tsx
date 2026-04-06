import { useMemo, useState, useRef, useEffect, memo, useCallback } from "react";
import { Search, X } from "lucide-react";
import type { Product } from "@/types/Product";
import { search, type SearchOutput } from "@/utils/search";
import { useDebounce } from "@/hooks/useDebounce";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Button } from "@/components/ui/button";

interface Props {
    query: string;
    onChange: (query: string) => void;
    products: Product[];
    onSelect: (product: Product) => void;
    category: string | null;
}

function SearchBarComponent({ query, onChange, products, onSelect, category }: Props) {
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const isCodeQuery = /^\d/.test(query.trim());
    const debouncedQuery = useDebounce(query, isCodeQuery ? 50 : 200);

    useClickOutside(containerRef, useCallback(() => setOpen(false), []));

    const results: SearchOutput = useMemo(() => {
        return search(debouncedQuery, { category });
    }, [debouncedQuery, products, category]);

    const allProducts = useMemo(() => [
        ...results.codeResults.map(r => r.product),
        ...results.tokenResults.map(r => r.product),
    ], [results]);

    const keywords = useMemo(() =>
        query.toLowerCase().trim().split(/\s+/).filter(k => k.length > 0),
    [query]);

    useEffect(() => { setSelectedIndex(-1); }, [debouncedQuery]);

    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-item]');
            (items[selectedIndex] as HTMLElement)?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
    }, [selectedIndex]);

    const handleSelect = useCallback((product: Product) => {
        onSelect(product);
        setOpen(false);
        setSelectedIndex(-1);
    }, [onSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!open || allProducts.length === 0) return;
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); setSelectedIndex(p => p < allProducts.length - 1 ? p + 1 : p); break;
            case 'ArrowUp': e.preventDefault(); setSelectedIndex(p => p > 0 ? p - 1 : -1); break;
            case 'Enter': e.preventDefault(); if (selectedIndex >= 0) handleSelect(allProducts[selectedIndex]); break;
            case 'Escape': setOpen(false); setSelectedIndex(-1); break;
        }
    }, [open, allProducts, selectedIndex, handleSelect]);

    function highlight(text: string): React.ReactNode {
        if (keywords.length === 0) return text;
        const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-transparent text-highlight font-bold">{part}</mark>
                : part
        );
    }

    function buildMeta(product: Product): { label: string; cls: string }[] {
        const meta: { label: string; cls: string }[] = [];
        if (product.category !== "Altele")
            meta.push({ label: product.category, cls: "bg-tag-category-bg text-tag-category-text" });
        if (product.productMaterial)
            meta.push({ label: product.productMaterial, cls: "bg-tag-material-bg text-tag-material-text" });
        if (product.dimensions?.diameter)
            meta.push({ label: `⌀${product.dimensions.diameter}`, cls: "bg-tag-dimension-bg text-tag-dimension-text" });
        if (product.dimensions?.angle)
            meta.push({ label: `${product.dimensions.angle}°`, cls: "bg-tag-dimension-bg text-tag-dimension-text" });
        if (product.dimensions?.threadSize)
            product.dimensions.threadSize.forEach(t =>
                meta.push({ label: `${t}"`, cls: "bg-tag-dimension-bg text-tag-dimension-text" }));
        if (product.color)
            meta.push({ label: product.color, cls: "bg-tag-color-bg text-tag-color-text" });
        return meta;
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                <input
                    value={query}
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cauta dupa cod sau descriere..."
                    className="w-full h-12 rounded-lg border border-input bg-card pl-11 pr-10 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/70 placeholder:font-normal transition-all focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/10 focus-visible:shadow-lg focus-visible:shadow-primary/5 dark:bg-card/80 dark:backdrop-blur-sm"
                />
                {query && (
                    <button
                        onClick={() => { onChange(""); setOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {open && results.total > 0 && (
                <div className="absolute z-50 mt-2 w-full rounded-xl bg-popover border border-border shadow-xl shadow-foreground/5 overflow-hidden animate-scale-in">
                    <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                            {results.total} {results.total === 1 ? 'rezultat' : 'rezultate'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wider">
                            ↑↓ &middot; ↵
                        </span>
                    </div>

                    <div ref={listRef} className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
                        {results.codeResults.length > 0 && (
                            <>
                                <SectionLabel>Coduri</SectionLabel>
                                {results.codeResults.map((r, i) => (
                                    <Row key={`c-${r.product.code}`} product={r.product} isSelected={i === selectedIndex}
                                        onClick={() => handleSelect(r.product)} highlight={highlight}
                                        meta={buildMeta(r.product)} index={i} />
                                ))}
                            </>
                        )}
                        {results.tokenResults.length > 0 && (
                            <>
                                <SectionLabel border={results.codeResults.length > 0}>Produse</SectionLabel>
                                {results.tokenResults.map((r, i) => {
                                    const idx = results.codeResults.length + i;
                                    return <Row key={`t-${r.product.code}`} product={r.product} isSelected={idx === selectedIndex}
                                        onClick={() => handleSelect(r.product)} highlight={highlight}
                                        meta={buildMeta(r.product)} index={i} />;
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}

            {open && results.total === 0 && debouncedQuery.trim().length > 0 && (
                <div className="absolute z-50 mt-2 w-full rounded-xl bg-popover border border-border shadow-xl shadow-foreground/5 p-8 text-center animate-scale-in">
                    <p className="text-sm font-medium text-muted-foreground">Niciun rezultat</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Incearca alt cod sau alte cuvinte</p>
                </div>
            )}
        </div>
    );
}

function SectionLabel({ children, border }: { children: React.ReactNode; border?: boolean }) {
    return (
        <div className={`px-4 py-1.5 bg-muted/40 text-[10px] font-bold font-mono text-muted-foreground/70 uppercase tracking-[0.15em] ${border ? 'border-t border-border' : ''}`}>
            {children}
        </div>
    );
}

interface RowProps {
    product: Product;
    isSelected: boolean;
    onClick: () => void;
    highlight: (text: string) => React.ReactNode;
    meta: { label: string; cls: string }[];
    index: number;
}

const Row = memo(function Row({ product, isSelected, onClick, highlight, meta, index }: RowProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(product.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { /* noop */ }
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
                <div className="text-sm font-medium text-foreground truncate leading-snug">
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

export default memo(SearchBarComponent);
