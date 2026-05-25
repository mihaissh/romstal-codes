import { forwardRef } from "react";
import type { Product } from "@/types/Product";
import type { SearchOutput } from "@/utils/search";
import { SearchRow } from "./SearchRow";

interface SearchResultsProps {
    results: SearchOutput;
    selectedIndex: number;
    onSelect: (product: Product) => void;
    highlight: (text: string) => React.ReactNode;
}

export const SearchResults = forwardRef<HTMLDivElement, SearchResultsProps>(({ 
    results, 
    selectedIndex, 
    onSelect, 
    highlight 
}, ref) => {
    if (results.total === 0) return null;

    return (
        <div className="absolute z-50 mt-2 w-full rounded-xl bg-popover border border-border shadow-xl shadow-foreground/5 overflow-hidden animate-scale-in">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                    {results.total} {results.total === 1 ? 'rezultat' : 'rezultate'}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wider">
                    ↑↓ &middot; ↵
                </span>
            </div>

            <div ref={ref} className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
                {results.codeResults.length > 0 && (
                    <>
                        <SectionLabel>Coduri</SectionLabel>
                        {results.codeResults.map((r, i) => (
                            <SearchRow 
                                key={`c-${r.product.code}-${r.product.store}-${r.product.storage}`} 
                                product={r.product} 
                                isSelected={i === selectedIndex}
                                onClick={() => onSelect(r.product)} 
                                highlight={highlight}
                                index={i} 
                            />
                        ))}
                    </>
                )}
                {results.tokenResults.length > 0 && (
                    <>
                        <SectionLabel border={results.codeResults.length > 0}>Produse</SectionLabel>
                        {results.tokenResults.map((r, i) => {
                            const idx = results.codeResults.length + i;
                            return (
                                <SearchRow 
                                    key={`t-${r.product.code}-${r.product.store}-${r.product.storage}`} 
                                    product={r.product} 
                                    isSelected={idx === selectedIndex}
                                    onClick={() => onSelect(r.product)} 
                                    highlight={highlight}
                                    index={i} 
                                />
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
});

function SectionLabel({ children, border }: { children: React.ReactNode; border?: boolean }) {
    return (
        <div className={`px-4 py-1.5 bg-muted/40 text-[10px] font-bold font-mono text-muted-foreground/70 uppercase tracking-[0.15em] ${border ? 'border-t border-border' : ''}`}>
            {children}
        </div>
    );
}

SearchResults.displayName = "SearchResults";
