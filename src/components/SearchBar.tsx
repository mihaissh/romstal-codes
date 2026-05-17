import { useMemo, useState, useRef, useEffect, memo, useCallback } from "react";
import type { Product } from "@/types/Product";
import { searchSupabase, type SearchOutput } from "@/utils/search";
import { useDebounce } from "@/hooks/useDebounce";
import { useClickOutside } from "@/hooks/useClickOutside";
import SearchInput from "./search/SearchInput";
import { SearchResults } from "./search/SearchResults";

interface Props {
    query: string;
    onChange: (query: string) => void;
    onSelect: (product: Product) => void;
    category: string | null;
}

function SearchBarComponent({ query, onChange, onSelect, category }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchOutput>({ codeResults: [], tokenResults: [], total: 0 });
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const isCodeQuery = /^\d/.test(query.trim());
    const debouncedQuery = useDebounce(query, isCodeQuery ? 50 : 300);

    useClickOutside(containerRef, useCallback(() => setOpen(false), []));

    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery.trim()) {
                setResults({ codeResults: [], tokenResults: [], total: 0 });
                return;
            }

            setLoading(true);
            const searchResults = await searchSupabase(debouncedQuery, { category });
            setResults(searchResults);
            setLoading(false);
        };

        performSearch();
    }, [debouncedQuery, category]);

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

    const highlight = useCallback((text: string): React.ReactNode => {
        if (keywords.length === 0) return text;
        const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-transparent text-highlight font-bold">{part}</mark>
                : part
        );
    }, [keywords]);

    const buildMeta = useCallback((product: Product): { label: string; cls: string }[] => {
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
    }, []);

    return (
        <div ref={containerRef} className="relative w-full">
            <SearchInput 
                query={query} 
                onChange={(v) => { onChange(v); setOpen(true); }} 
                onFocus={() => setOpen(true)} 
                onKeyDown={handleKeyDown} 
                loading={loading} 
                onClear={() => { onChange(""); setOpen(false); }} 
            />

            {open && results.total > 0 && (
                <SearchResults 
                    ref={listRef}
                    results={results} 
                    selectedIndex={selectedIndex} 
                    onSelect={handleSelect} 
                    highlight={highlight} 
                    buildMeta={buildMeta} 
                />
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

export default memo(SearchBarComponent);
