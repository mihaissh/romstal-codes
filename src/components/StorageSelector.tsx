import { memo, useState, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "../hooks/useClickOutside";

type StorageLocation = "deposit" | "expo";

const STORAGE_OPTIONS: Record<StorageLocation, { label: string; code: string }> = {
    "deposit": { label: "Depozit", code: "1V00" },
    "expo": { label: "Expoziție", code: "1V06" },
};

interface StorageSelectorProps {
    currentStorage: StorageLocation;
    onStorageSelect: (storage: StorageLocation) => void;
    availableStorages: StorageLocation[]; // Which storages are available for current store
}

const StorageSelector = memo(function StorageSelector({
    currentStorage,
    onStorageSelect,
    availableStorages,
}: StorageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useClickOutside(containerRef, useCallback(() => setIsOpen(false), []));

    const handleStorageClick = (storage: StorageLocation) => {
        if (storage !== currentStorage) {
            onStorageSelect(storage);
        }
        setIsOpen(false);
    };

    // Only show selector if there are multiple storage options
    if (availableStorages.length <= 1) {
        return null;
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 sm:px-4 py-3 sm:py-4 md:py-6 rounded-2xl border-2 border-slate-700/50 bg-slate-800/60 backdrop-blur-md text-slate-100 font-semibold text-xs sm:text-sm md:text-base shadow-2xl shadow-black/30 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 hover:border-slate-600/70 hover:bg-slate-800/70 whitespace-nowrap min-w-[85px] sm:min-w-[100px] md:min-w-[120px]"
            >
                {STORAGE_OPTIONS[currentStorage].label}
                <ChevronDown
                    size={16}
                    className={`inline-block ml-2 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden min-w-[140px]">
                    {availableStorages.map((storage) => {
                        const isSelected = currentStorage === storage;
                        return (
                            <button
                                key={storage}
                                onClick={() => handleStorageClick(storage)}
                                className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700 last:border-b-0 ${
                                    isSelected ? "bg-slate-700/50" : ""
                                }`}
                            >
                                <p className="text-sm text-slate-100 font-semibold">
                                    {STORAGE_OPTIONS[storage].label}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export default StorageSelector;
export type { StorageLocation };
