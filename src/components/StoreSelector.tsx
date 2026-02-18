import { memo, useState, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "../hooks/useClickOutside";

type StoreCode = "1BN1" | "1BV1";
const STORES: StoreCode[] = ["1BN1", "1BV1"];

interface StoreSelectorProps {
    currentStore: StoreCode;
    onStoreSelect: (storeCode: StoreCode) => void;
}

const StoreSelector = memo(function StoreSelector({ currentStore, onStoreSelect }: StoreSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, useCallback(() => setIsOpen(false), []));

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm font-semibold text-zinc-200 hover:bg-surface-3 hover:border-border-hover transition-colors"
            >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {currentStore}
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 left-0 bg-surface-2 border border-border rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden min-w-[80px] animate-scale-in">
                    {STORES.map(code => (
                        <button
                            key={code}
                            onClick={() => { onStoreSelect(code); setIsOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                code === currentStore ? "text-amber-400 bg-accent-dim" : "text-zinc-300 hover:bg-surface-3"
                            }`}
                        >
                            {code}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

export default StoreSelector;
