import { useMemo, useState, useRef, useEffect, memo, useCallback } from "react";
import type { Product } from "@/types/Product";
import { searchSupabase, type SearchOutput } from "@/utils/search";
import { useDebounce } from "@/hooks/useDebounce";
import { useClickOutside } from "@/hooks/useClickOutside";
import SearchInput from "./search/SearchInput";
import { SearchResults } from "./search/SearchResults";


import type { FilialaCode } from "@/types/filiala";
import type { StorageLocation } from "./StorageSelector";

interface Props {
    query: string;
    onChange: (query: string) => void;
    onSelect: (product: Product) => void;
    category: string | null;
    store: FilialaCode;
    storage: StorageLocation;
}

function SearchBarComponent({ query, onChange, onSelect, category, store, storage }: Props) {
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
            const searchResults = await searchSupabase(debouncedQuery, { category, store, storage });
            setResults(searchResults);
            setLoading(false);
        };

        performSearch();
    }, [debouncedQuery, category, store, storage]);

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

    const getHighlightClass = (word: string): string => {
        const w = word.trim().toLowerCase();
        
        // Category (Blue)
        if (["cot", "teava", "tevi", "teu", "mufa", "robinet", "rob", "reductie", "red", "dop", "niplu", "racord", "bratara", "cruce"].includes(w)) {
            return "bg-tag-category-bg/20 text-tag-category-text font-bold px-1 rounded-sm";
        }
        
        // Material (Green)
        if (["ppr", "pvc", "pehd", "pe", "alama", "bronz", "cupru", "cu", "fonta", "inox"].includes(w)) {
            return "bg-tag-material-bg/20 text-tag-material-text font-bold px-1 rounded-sm";
        }
        
        // Color (Purple)
        if (["alb", "alba", "gri", "negru", "neagra", "albastru", "verde"].includes(w)) {
            return "bg-tag-color-bg/20 text-tag-color-text font-bold px-1 rounded-sm";
        }
        
        // Thread (Cyan)
        if (w.includes("/") || w.endsWith('"') || w.endsWith("tol")) {
            return "bg-tag-thread-bg/20 text-tag-thread-text font-bold px-1 rounded-sm";
        }
        
        // Angle (Rose)
        if (["90", "45", "30", "67", "87", "90°", "45°", "90g", "45g", "90grd", "45grd"].includes(w)) {
            return "bg-tag-angle-bg/20 text-tag-angle-text font-bold px-1 rounded-sm";
        }
        
        // Diameter (Amber)
        if (w.startsWith("d") || ["16", "20", "25", "32", "40", "50", "63", "75", "90", "110", "125", "160"].includes(w) || w.endsWith("mm")) {
            return "bg-tag-dimension-bg/20 text-tag-dimension-text font-bold px-1 rounded-sm";
        }
        
        return "bg-transparent text-highlight font-bold px-0.5";
    };

    const highlight = useCallback((text: string): React.ReactNode => {
        if (keywords.length === 0) return text;
        const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className={getHighlightClass(part)}>{part}</mark>
                : part
        );
    }, [keywords]);

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
