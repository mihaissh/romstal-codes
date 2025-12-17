import { useMemo, useState, useRef, useEffect } from "react";
import type { Product } from "../types/Product";
import { searchProducts } from "../utils/searchUtils";
import SearchResultItem from "./SearchResultItem";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
    query: string;
    onChange: (query: string) => void;
    products: Product[];
    onSelect: (product: Product) => void;
}

export default function SearchBar({ query, onChange, products, onSelect }: Props) {
    const [open, setOpen] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const results = useMemo(() => {
        return searchProducts(query, products, 10);
    }, [query, products]);

    // Extract keywords from query for highlighting
    const keywords = useMemo(() => {
        return query
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter(k => k.length > 0);
    }, [query]);

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(-1);
    }, [query]);

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedIndex]);

    const handleSelect = (product: Product) => {
        onChange(product.Material);
        onSelect(product);
        setOpen(false);
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full"
        >
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-6 h-6 text-slate-500" />
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
                    className="w-full rounded-2xl border-2 border-slate-700 bg-slate-800/50 backdrop-blur-sm pl-12 sm:pl-14 pr-12 sm:pr-6 py-4 sm:py-6 text-base sm:text-lg font-medium text-slate-100 placeholder-slate-500 shadow-xl transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:bg-slate-800/80 hover:border-slate-600"
                />
                {query && (
                    <button
                        onClick={() => {
                            onChange("");
                            setOpen(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 mt-3 w-full rounded-2xl bg-slate-800/95 backdrop-blur-xl shadow-2xl shadow-black/20 border border-slate-700 overflow-hidden animate-slide-in-down">
                    <div className="px-6 py-3 border-b border-slate-700 bg-slate-800/80">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {results.length} {results.length === 1 ? 'result' : 'results'}
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-slate-500">In Stock</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    <span className="text-slate-500">Low</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-slate-500">Out</span>
                                </div>
                            </div>
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