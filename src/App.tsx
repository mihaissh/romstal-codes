import { useState, useMemo, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Results from "@/components/Results";
import SearchHistory from "@/components/SearchHistory";
import Header from "@/components/Header";
import StoreSelector from "@/components/StoreSelector";
import StorageSelector, { type StorageLocation } from "@/components/StorageSelector";
import ChangeCalculator from "@/components/ChangeCalculator";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useTheme } from "@/hooks/useTheme";
import products1bn1Deposit from "@/stoc_1bn1_deposit.json";
import products1bn1Expo from "@/stoc_1bn1_expo.json";
import products1bv1Deposit from "@/stoc_1bv1_deposit.json";
import products1bv1Expo from "@/stoc_1bv1_expo.json";
import type { Product } from "@/types/Product";
import { buildIndex, clearIndex } from "@/utils/search";

type StoreCode = "1BN1" | "1BV1";
type View = "search" | "calculator";

export default function App() {
    const { theme, toggle: toggleTheme } = useTheme();
    const [view, setView] = useState<View>("search");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Product | null>(null);
    const [currentStore, setCurrentStore] = useState<StoreCode>("1BN1");
    const [currentStorage, setCurrentStorage] = useState<StorageLocation>("deposit");

    const toggleView = () => setView(v => v === "search" ? "calculator" : "search");

    const availableStorages = useMemo<StorageLocation[]>(() =>
        currentStore === "1BV1" ? ["deposit", "expo"] : ["deposit"],
    [currentStore]);

    useEffect(() => {
        if (!availableStorages.includes(currentStorage)) setCurrentStorage("deposit");
    }, [availableStorages, currentStorage]);

    const { history, historyItems, addToHistory, removeFromHistory, clearHistory } = useSearchHistory(currentStore);

    const products = useMemo(() => {
        if (currentStore === "1BN1") {
            return (currentStorage === "deposit" ? products1bn1Deposit : products1bn1Expo) as Product[];
        }
        return (currentStorage === "deposit" ? products1bv1Deposit : products1bv1Expo) as Product[];
    }, [currentStore, currentStorage]);

    useEffect(() => {
        buildIndex(products);
        return () => clearIndex();
    }, [products]);

    const handleSelectProduct = (product: Product) => {
        setSelected(product);
        addToHistory(product);
    };

    const handleStoreSelect = (storeCode: StoreCode) => {
        if (storeCode === currentStore) return;
        setCurrentStore(storeCode);
        setSelected(null);
        setQuery("");
        setCurrentStorage("deposit");
        clearIndex();
    };

    const handleStorageSelect = (storage: StorageLocation) => {
        if (storage === currentStorage) return;
        setCurrentStorage(storage);
        setSelected(null);
        setQuery("");
        clearIndex();
    };

    return (
        <div className="min-h-screen px-5 sm:px-6 pb-20">
            <div className="max-w-2xl mx-auto">
                <Header theme={theme} onToggleTheme={toggleTheme} view={view} onToggleView={toggleView} />

                {view === "search" ? (
                    <div key="search-view">
                        {/* Selectors */}
                        <div className="flex items-center gap-2 mb-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
                            <StoreSelector currentStore={currentStore} onStoreSelect={handleStoreSelect} />
                            <StorageSelector currentStorage={currentStorage} onStorageSelect={handleStorageSelect} availableStorages={availableStorages} />
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

                        {/* Search */}
                        <div className="relative z-50 mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
                            <SearchBar query={query} onChange={setQuery} products={products} onSelect={handleSelectProduct} category={null} />
                        </div>

                        {/* Product detail */}
                        {selected && (
                            <div className="mb-8">
                                <Results product={selected} onClear={() => setSelected(null)} />
                            </div>
                        )}

                        {/* History */}
                        {!selected && <SearchHistory history={history} historyItems={historyItems} onSelectProduct={handleSelectProduct} onDeleteItem={removeFromHistory} onClearAll={clearHistory} />}
                    </div>
                ) : (
                    <div key="calculator-view" className="pt-2">
                        <ChangeCalculator />
                    </div>
                )}

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 py-3 text-center pointer-events-none">
                    <p className="text-[10px] font-mono text-muted-foreground/30 tracking-wider pointer-events-auto">
                        built by{" "}
                        <a href="https://github.com/mihaissh" target="_blank" rel="noopener noreferrer"
                           className="text-muted-foreground/50 hover:text-primary transition-colors underline underline-offset-2 decoration-border hover:decoration-primary">
                            mihaissh
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
