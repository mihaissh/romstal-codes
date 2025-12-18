import { useState, memo } from "react";
import type { Product } from "../types/Product";
import { getStockStatus } from "../utils/searchUtils";
import { detectDiameters } from "../utils/highlightUtils";
import { HashtagIcon, XMarkIcon, CheckIcon, MapPinIcon, CubeIcon } from "@heroicons/react/24/outline";

interface Props {
    product: Product;
    onClear: () => void;
}

function ResultsComponent({ product, onClear }: Props) {
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
        <div className="rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/40 backdrop-blur-md border border-slate-700/50 shadow-2xl shadow-indigo-500/10 overflow-hidden animate-slide-in-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800/80 via-slate-700/40 to-slate-800/60 p-4 sm:p-8 border-b border-slate-700/60 relative">
                <button
                    onClick={onClear}
                    className="absolute top-4 right-4 p-2.5 rounded-lg bg-slate-700/40 hover:bg-red-500/25 border border-slate-600/50 hover:border-red-500/50 transition-all duration-200 group hover:scale-110"
                    title="Clear product"
                >
                    <XMarkIcon className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
                </button>

                <h2 className="text-lg sm:text-3xl font-bold text-slate-100 mb-5 leading-tight pr-12">
                    {product["Descriere material"]}
                </h2>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
                    {/* Product Code Section */}
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-slate-900/40 border border-slate-700/60 px-5 py-4 rounded-xl">
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                    <HashtagIcon className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Code</span>
                            </div>
                            <span className="font-mono text-lg sm:text-2xl text-indigo-300 font-bold">{product.Material}</span>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-slate-700/50"></div>
                        <button
                            onClick={handleCopy}
                            className={`w-full sm:w-auto px-4 py-2 border rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group font-semibold text-sm ${
                                copied
                                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-300 scale-105"
                                    : "bg-indigo-500/20 hover:bg-indigo-500/35 border-indigo-500/60 hover:border-indigo-400 text-indigo-300 hover:text-indigo-200"
                            }`}
                            title={copied ? "Copied!" : "Copy code"}
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="w-4 h-4 animate-bounce" />
                                    <span>Copiat!</span>
                                </>
                            ) : (
                                <>
                                    <span>Copiaza codul</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Stock Status */}
                    <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg border ${
                        stockStatus.label === 'In stock' ? 'bg-green-500/15 border-green-500/40' :
                        stockStatus.label === 'Low stock' ? 'bg-yellow-500/15 border-yellow-500/40' :
                        'bg-red-500/15 border-red-500/40'
                    }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${stockStatus.bgColor}`} />
                        <span className={`text-sm font-bold ${stockStatus.color}`}>
                            {stockStatus.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
                {/* Diameter Card (conditional) */}
                {diameters.length > 0 && (
                    <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-sky-500/15 to-sky-600/10 border border-sky-500/40 shadow-lg shadow-sky-500/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-sky-500/30 border border-sky-500/50">
                                <span className="text-lg font-bold text-sky-400">⌀</span>
                            </div>
                            <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wider">Diameter</h3>
                        </div>
                        <div className="text-4xl font-bold text-sky-300">
                            {diameters.join(", ")}
                        </div>
                    </div>
                )}

                {/* Additional Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Storage Location Card */}
                    <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                <MapPinIcon className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Location</h4>
                        </div>
                        <div className="text-slate-200 font-semibold mb-1">{product["Loc de depozitare"]}</div>
                        <div className="text-sm text-slate-400">{product["Descr.loc.depozitare"]}</div>
                    </div>

                    {/* Unit Location Card */}
                    <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-200">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                <CubeIcon className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logistics Unit</h4>
                        </div>
                        <div className="text-slate-200 font-semibold mb-1">{product["Name 1"]}</div>
                        <div className="text-sm text-slate-400">{product["Unitate logistică"]}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ResultsComponent);