import { memo, useState, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "../hooks/useClickOutside";

type StoreCode = "1BN1" | "1BV1";

const STORES: StoreCode[] = ["1BN1", "1BV1"];

interface StoreSelectorProps {
    currentStore: StoreCode;
    onStoreSelect: (storeCode: StoreCode) => void;
}

const StoreSelector = memo(function StoreSelector({
    currentStore,
    onStoreSelect,
}: StoreSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useClickOutside(containerRef, useCallback(() => setIsOpen(false), []));

    const handleStoreClick = (storeCode: StoreCode) => {
        if (storeCode !== currentStore) {
            onStoreSelect(storeCode);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 sm:px-4 py-3 sm:py-4 md:py-6 rounded-2xl border-2 border-slate-700/50 bg-slate-800/60 backdrop-blur-md text-slate-100 font-semibold text-xs sm:text-sm md:text-base shadow-2xl shadow-black/30 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 hover:border-slate-600/70 hover:bg-slate-800/70 whitespace-nowrap min-w-[70px] sm:min-w-[80px] md:min-w-[100px]"
            >
                {currentStore}
                <ChevronDown
                    size={16}
                    className={`inline-block ml-2 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden min-w-[80px]">
                    {STORES.map((storeCode) => (
                        <button
                            key={storeCode}
                            onClick={() => handleStoreClick(storeCode)}
                            className={`w-full px-4 py-3 text-center hover:bg-slate-700/50 transition-colors text-sm font-semibold ${
                                storeCode === currentStore
                                    ? "bg-slate-700/30 text-slate-100"
                                    : "text-slate-100"
                            } ${storeCode !== STORES[STORES.length - 1] ? "border-b border-slate-700" : ""}`}
                        >
                            {storeCode}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

export default StoreSelector;
