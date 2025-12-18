import { useMemo, useState, useRef, useEffect, memo, useCallback } from "react";
import type { Product } from "../types/Product";
import { searchProducts } from "../utils/searchUtils";
import SearchResultItem from "./SearchResultItem";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "../hooks/useDebounce";
import { useClickOutside } from "../hooks/useClickOutside";
import { DEBOUNCE_DELAY } from "../constants/searchConstants";

interface Props {
    query: string;
    onChange: (query: string) => void;
    products: Product[];
    onSelect: (product: Product) => void;
}

function SearchBarComponent({ query, onChange, products, onSelect }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Debounce the search query to prevent excessive searches
    const debouncedQuery = useDebounce(query, DEBOUNCE_DELAY);

    // Close dropdown when clicking outside
    useClickOutside(containerRef, useCallback(() => setOpen(false), []));

    const results = useMemo(() => {
        return searchProducts(debouncedQuery, products, Infinity);
    }, [debouncedQuery, products]);

    // Extract keywords from query for highlighting (responsive, not debounced)
    const keywords = useMemo(() => {
        return query
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter(k => k.length > 0);
    }, [query]);

    // Reset selected index when debounced query changes
    useEffect(() => {
        setSelectedIndex(-1);
    }, [debouncedQuery]);

    // Scroll selected item into view with instant scrolling
    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'auto'
                });
            }
        }
    }, [selectedIndex]);

    const handleSelect = useCallback((product: Product) => {
        onChange(product.Material);
        onSelect(product);
        setOpen(false);
        setSelectedIndex(-1);
    }, [onChange, onSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    handleSelect(results[selectedIndex].product);
                }
                break;
            case 'Escape':
                setOpen(false);
                setSelectedIndex(-1);
                break;
        }
    }, [open, results, selectedIndex, handleSelect]);

    const handleClearQuery = useCallback(() => {
        onChange("");
        setOpen(false);
    }, [onChange]);

    return (
        <div
            ref={containerRef}
            className="relative w-full"
        >
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                </div>
                <input
                    value={query}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cauta produs dupa cod, nume sau keyword-uri..."
                    className="w-full rounded-2xl border-2 border-slate-700/50 bg-slate-800/60 backdrop-blur-md pl-12 sm:pl-14 pr-12 sm:pr-6 py-4 sm:py-6 text-base sm:text-lg font-medium text-slate-100 placeholder-slate-400 shadow-2xl shadow-black/30 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 focus:bg-slate-800/90 focus:shadow-lg focus:shadow-indigo-500/20 hover:border-slate-600/70 hover:bg-slate-800/70"
                />
                {query && (
                    <button
                        onClick={handleClearQuery}
                        className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label="Clear search"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 mt-3 w-full rounded-2xl bg-slate-800/95 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 border border-slate-700/80 overflow-hidden animate-slide-in-down">
                    <div className="px-6 py-3 border-b border-slate-700/60 bg-gradient-to-r from-slate-800/60 to-slate-700/40">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-sm font-bold text-indigo-300">
                                {results.length} {results.length === 1 ? 'resultat' : 'rezultate'}
                            </span>
                        </div>
                    </div>
                    <ul ref={listRef} className="py-2 max-h-96 overflow-y-auto custom-scrollbar">
                        {results.map((result, index) => (
                            <SearchResultItem
                                key={result.product.Material}
                                product={result.product}
                                onClick={() => handleSelect(result.product)}
                                searchKeywords={keywords}
                                isSelected={index === selectedIndex}
                            />
                        ))}
                    </ul>
                </div>
            )}

            {open && results.length === 0 && query && (
                <div className="absolute z-50 mt-3 w-full rounded-2xl bg-slate-800/95 backdrop-blur-xl shadow-2xl shadow-black/20 border border-slate-700 p-8 text-center transition-all duration-200 ease-out">
                    <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-slate-400 text-sm font-medium mb-1">No products found</div>
                    <div className="text-slate-500 text-xs">Try different keywords or product codes</div>
                </div>
            )}
        </div>
    );
}

export default memo(SearchBarComponent);