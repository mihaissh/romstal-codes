import { memo, useMemo, useCallback } from "react";
import type { Product } from "../types/Product";
import { highlightTextWithDiameters } from "../utils/highlightUtils";
import HighlightedText from "./HighlightedText";
import { HashtagIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface Props {
    product: Product;
    onClick: () => void;
    searchKeywords?: string[];
    isSelected?: boolean;
}

function SearchResultItemComponent({ product, onClick, searchKeywords = [], isSelected = false }: Props) {
    const [copied, setCopied] = useState(false);

    // Process description with diameter detection, thread detection, and search term highlighting
    const { segments, diameters, threads } = useMemo(
        () => highlightTextWithDiameters(product["Descriere material"], searchKeywords),
        [product["Descriere material"], searchKeywords]
    );

    const handleCopy = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(product.Material);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }, [product.Material]);

    return (
        <li
            onClick={onClick}
            className={`px-4 sm:px-6 py-3 sm:py-4 cursor-pointer transition-colors duration-75 border-l-4 group will-change-colors ${
                isSelected
                    ? 'bg-slate-700/70 border-indigo-500'
                    : 'border-transparent hover:bg-slate-700/50 hover:border-indigo-500'
            }`}
        >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                {/* Left: Product Description */}
                <div className="flex-1 w-full min-w-0">
                    <div className="font-semibold text-slate-100 text-sm sm:text-base leading-tight mb-3 group-hover:text-indigo-300 transition-colors duration-75">
                        <HighlightedText segments={segments} />
                    </div>

                    {/* Diameter & Thread Badges */}
                    {(diameters.length > 0 || threads.length > 0) && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {diameters.length > 0 && (
                                <div className="flex items-center gap-1.5 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/30">
                                    <span className="text-xs font-semibold text-sky-400">
                                        ⌀ {diameters[0]}
                                    </span>
                                </div>
                            )}
                            {threads.length > 0 && (
                                <div className="flex items-center gap-1.5 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/30">
                                    <span className="text-xs font-semibold text-violet-400">
                                        {threads[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Product Code & Copy Button */}
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 bg-indigo-500/15 px-3 py-1.5 rounded-lg border border-indigo-500/40 flex-1 sm:flex-none">
                        <HashtagIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="font-mono text-sm font-bold text-indigo-300 min-w-0 truncate">
                            {product.Material}
                        </span>
                    </div>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className={`px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all duration-300 flex items-center gap-1.5 flex-shrink-0 ${
                            copied
                                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                                : 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 hover:bg-indigo-500/35 group-hover:border-indigo-400'
                        }`}
                        title={copied ? 'Copied!' : 'Copy code'}
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="w-3.5 h-3.5" />
                                <span>OK!</span>
                            </>
                        ) : (
                            <span>Copy</span>
                        )}
                    </button>
                </div>
            </div>
        </li>
    );
}

export default memo(SearchResultItemComponent, (prevProps, nextProps) => {
    return (
        prevProps.product.Material === nextProps.product.Material &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.searchKeywords?.join(',') === nextProps.searchKeywords?.join(',')
    );
});