import { useMemo, useState, useRef, useEffect, memo, useCallback } from "react";
import type { Product } from "../types/Product";
import { search, type SearchOutput } from "../utils/search";
import { useDebounce } from "../hooks/useDebounce";
import { useClickOutside } from "../hooks/useClickOutside";

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
        onChange(product.code);
        onSelect(product);
        setOpen(false);
        setSelectedIndex(-1);
    }, [onChange, onSelect]);

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
                ? <span key={i} className="text-amber-400 font-semibold">{part}</span>
                : part
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                    value={query}
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cauta produs... (cod sau descriere)"
                    className="w-full bg-surface-2 border border-border rounded-xl pl-11 pr-10 py-3.5 text-[15px] text-zinc-100 placeholder-zinc-600 transition-colors focus:outline-none focus:border-zinc-600 focus:bg-surface-3 hover:border-border-hover"
                />
                {query && (
                    <button
                        onClick={() => { onChange(""); setOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-surface-3 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {open && results.total > 0 && (
                <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-surface-2 border border-border shadow-2xl shadow-black/50 overflow-hidden animate-scale-in">
                    <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500">
                            {results.total} {results.total === 1 ? 'rezultat' : 'rezultate'}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                            ↑↓ navigheaza &middot; ↵ selecteaza
                        </span>
                    </div>

                    <div ref={listRef} className="max-h-80 overflow-y-auto">
                        {results.codeResults.length > 0 && (
                            <>
                                <div className="px-3 py-1.5 bg-surface text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                    Coduri
                                </div>
                                {results.codeResults.map((r, i) => (
                                    <Row key={`c-${r.product.code}`} product={r.product} isSelected={i === selectedIndex}
                                        onClick={() => handleSelect(r.product)} highlight={highlight} />
                                ))}
                            </>
                        )}
                        {results.tokenResults.length > 0 && (
                            <>
                                {results.codeResults.length > 0 && (
                                    <div className="px-3 py-1.5 bg-surface border-t border-border text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                        Produse
                                    </div>
                                )}
                                {results.tokenResults.map((r, i) => {
                                    const idx = results.codeResults.length + i;
                                    return <Row key={`t-${r.product.code}`} product={r.product} isSelected={idx === selectedIndex}
                                        onClick={() => handleSelect(r.product)} highlight={highlight} />;
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}

            {open && results.total === 0 && debouncedQuery.trim().length > 0 && (
                <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-surface-2 border border-border shadow-2xl shadow-black/50 p-6 text-center animate-scale-in">
                    <p className="text-sm text-zinc-500">Niciun rezultat</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Incearca alt cod sau alte cuvinte</p>
                </div>
            )}
        </div>
    );
}

interface RowProps {
    product: Product;
    isSelected: boolean;
    onClick: () => void;
    highlight: (text: string) => React.ReactNode;
}

const Row = memo(function Row({ product, isSelected, onClick, highlight }: RowProps) {
    return (
        <div
            data-item
            onClick={onClick}
            className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors duration-75 ${
                isSelected ? 'bg-surface-3' : 'hover:bg-surface-3/50'
            }`}
        >
            <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-200 truncate leading-tight">
                    {highlight(product.name)}
                </div>
                {product.category !== 'Altele' && (
                    <span className="text-[10px] text-zinc-600 mt-0.5 inline-block">{product.category}</span>
                )}
            </div>
            <code className="flex-shrink-0 text-xs font-mono text-amber-400/80 bg-amber-500/8 px-2 py-0.5 rounded">
                {product.code}
            </code>
        </div>
    );
});

export default memo(SearchBarComponent);
