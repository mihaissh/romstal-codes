import { useState } from "react";
import type { Product } from "../types/Product";
import { getStockStatus } from "../utils/searchUtils";
import { detectDiameters } from "../utils/highlightUtils";
import { HashtagIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";

interface Props {
    product: Product;
    onClear: () => void;
}

export default function Results({ product, onClear }: Props) {
    const stockStatus = getStockStatus(product["Fără restr."]);
    const [copied, setCopied] = useState(false);

    // Detect diameters in the product description
    const { diameters } = detectDiameters(product["Descriere material"]);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(product.Material);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl shadow-black/10 overflow-hidden animate-slide-in-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 p-4 sm:p-6 border-b border-slate-700 relative">
                <button
                    onClick={onClear}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900/50 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/50 transition-all duration-200 group"
                    title="Clear product"
                >
                    <XMarkIcon className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
                </button>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100 mb-3 leading-tight pr-12">
                    {product["Descriere material"]}
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-slate-900/50 border border-slate-700 px-4 sm:px-5 py-3 rounded-lg">
                        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                                <HashtagIcon className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-400" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</span>
                            </div>
                            <span className="font-mono text-base sm:text-xl text-indigo-400 font-bold">{product.Material}</span>
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-slate-700"></div>
                        <button
                            onClick={handleCopy}
                            className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 border rounded-md transition-all duration-300 flex items-center justify-center gap-1.5 group ${
                                copied
                                    ? "bg-emerald-500/30 border-emerald-400 scale-105"
                                    : "bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/50 hover:border-indigo-400"
                            }`}
                            title={copied ? "Copied!" : "Copy code"}
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-4 h-4 text-emerald-300 animate-bounce" />
                                    <span className="text-xs font-semibold text-emerald-300">Copiat!</span>
                                </>
                            ) : (
                                <span className="text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">Copiaza codul</span>
                            )}
                        </button>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700`}>
                        <div className={`w-2 h-2 rounded-full ${stockStatus.bgColor}`} />
                        <span className={`text-xs font-semibold ${stockStatus.color}`}>
                            {stockStatus.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Diameter Card (conditional) */}
                {diameters.length > 0 && (
                    <div className="mb-6">
                        <div className="bg-slate-900/30 rounded-xl p-6 border border-sky-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold text-sky-400">⌀</span>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Diameter
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-sky-400">
                                {diameters.join(", ")}
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/20 rounded-xl p-4 border border-slate-700/30">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Storage Location</div>
                        <div className="text-slate-200 font-medium">{product["Loc de depozitare"]}</div>
                        <div className="text-sm text-slate-400 mt-1">{product["Descr.loc.depozitare"]}</div>
                    </div>

                    <div className="bg-slate-900/20 rounded-xl p-4 border border-slate-700/30">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</div>
                        <div className="text-slate-200 font-medium">{product["Name 1"]}</div>
                        <div className="text-sm text-slate-400 mt-1">{product["Unitate logistică"]}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}