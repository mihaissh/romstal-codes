import type { Product } from "../types/Product";
import { getStockStatus } from "../utils/searchUtils";
import { highlightTextWithDiameters } from "../utils/highlightUtils";
import HighlightedText from "./HighlightedText";
import CopyButton from "./CopyButton";
import { HashtagIcon } from "@heroicons/react/24/outline";

interface Props {
    product: Product;
    onClick: () => void;
    searchKeywords?: string[];
    isSelected?: boolean;
}

export default function SearchResultItem({ product, onClick, searchKeywords = [], isSelected = false }: Props) {
    const stockStatus = getStockStatus(product["Fără restr."]);

    // Process description with diameter detection, thread detection, and search term highlighting
    const { segments, diameters, threads } = highlightTextWithDiameters(
        product["Descriere material"],
        searchKeywords
    );

    return (
        <li
            onClick={onClick}
            className={`px-4 sm:px-6 py-3 sm:py-4 cursor-pointer transition-all duration-150 border-l-4 group ${
                isSelected
                    ? 'bg-slate-700/70 border-indigo-500'
                    : 'border-transparent hover:bg-slate-700/50 hover:border-indigo-500'
            }`}
        >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0 mb-2">
                <div className="flex-1 w-full sm:pr-4">
                    <div className="font-semibold text-slate-100 text-sm sm:text-base leading-tight mb-2 group-hover:text-indigo-300 transition-colors">
                        <HighlightedText segments={segments} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Product Code Badge with Icon */}
                        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
                            <HashtagIcon className="w-4 h-4 text-indigo-400" />
                            <span className="font-mono text-sm font-bold text-indigo-300">
                                {product.Material}
                            </span>
                            <div className="w-px h-4 bg-slate-700"></div>
                            <CopyButton textToCopy={product.Material} />
                        </div>

                        {/* Diameter Badge (if found) */}
                        {diameters.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/30">
                                <span className="text-xs font-semibold text-sky-400">
                                    ⌀ {diameters[0]}
                                </span>
                            </div>
                        )}

                        {/* Thread Type Badge (if found) */}
                        {threads.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/30">
                                <span className="text-xs font-semibold text-violet-400">
                                    {threads[0]}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    <div className={`text-xs sm:text-sm font-semibold ${stockStatus.color}`}>
                        {product["Fără restr."]}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${stockStatus.bgColor} group-hover:opacity-80 transition-opacity`} />
                </div>
            </div>
        </li>
    );
}