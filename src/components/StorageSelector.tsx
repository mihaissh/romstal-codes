import { memo, useState, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "../hooks/useClickOutside";

type StorageLocation = "deposit" | "expo";

const LABELS: Record<StorageLocation, string> = {
    deposit: "Depozit",
    expo: "Expozitie",
};

interface StorageSelectorProps {
    currentStorage: StorageLocation;
    onStorageSelect: (storage: StorageLocation) => void;
    availableStorages: StorageLocation[];
}

const StorageSelector = memo(function StorageSelector({ currentStorage, onStorageSelect, availableStorages }: StorageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useClickOutside(containerRef, useCallback(() => setIsOpen(false), []));

    if (availableStorages.length <= 1) return null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm font-semibold text-zinc-200 hover:bg-surface-3 hover:border-border-hover transition-colors"
            >
                {LABELS[currentStorage]}
                <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 left-0 bg-surface-2 border border-border rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden min-w-[120px] animate-scale-in">
                    {availableStorages.map(storage => (
                        <button
                            key={storage}
                            onClick={() => { onStorageSelect(storage); setIsOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                storage === currentStorage ? "text-amber-400 bg-accent-dim" : "text-zinc-300 hover:bg-surface-3"
                            }`}
                        >
                            {LABELS[storage]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

export default StorageSelector;
export type { StorageLocation };
