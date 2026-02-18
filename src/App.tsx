import { useState, useMemo, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import Results from "./components/Results";
import SearchHistory from "./components/SearchHistory";
import Header from "./components/Header";
import StoreSelector from "./components/StoreSelector";
import StorageSelector, { type StorageLocation } from "./components/StorageSelector";
import CategoryFilter from "./components/CategoryFilter";
import { useSearchHistory } from "./hooks/useSearchHistory";
import products1bn1Deposit from "./stoc_1bn1_deposit.json";
import products1bn1Expo from "./stoc_1bn1_expo.json";
import products1bv1Deposit from "./stoc_1bv1_deposit.json";
import products1bv1Expo from "./stoc_1bv1_expo.json";
import type { Product } from "./types/Product";
import { buildIndex, clearIndex, getCategories } from "./utils/search";

type StoreCode = "1BN1" | "1BV1";

export default function App() {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Product | null>(null);
    const [currentStore, setCurrentStore] = useState<StoreCode>("1BN1");
    const [currentStorage, setCurrentStorage] = useState<StorageLocation>("deposit");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

    const categories = useMemo(() => getCategories(products), [products]);

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
        setSelectedCategory(null);
        clearIndex();
    };

    const handleStorageSelect = (storage: StorageLocation) => {
        if (storage === currentStorage) return;
        setCurrentStorage(storage);
        setSelected(null);
        setQuery("");
        setSelectedCategory(null);
        clearIndex();
    };

    return (
        <div className="min-h-screen px-4 sm:px-6 pb-16">
            <div className="max-w-2xl mx-auto">
                {/* Header row */}
                <div className="flex items-end justify-between">
                    <Header />
                    <div className="flex items-center gap-2 pb-3">
                        <StoreSelector currentStore={currentStore} onStoreSelect={handleStoreSelect} />
                        <StorageSelector currentStorage={currentStorage} onStorageSelect={handleStorageSelect} availableStorages={availableStorages} />
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-5" />

                {/* Search + Filters */}
                <div className="space-y-3 mb-6">
                    <SearchBar query={query} onChange={setQuery} products={products} onSelect={handleSelectProduct} category={selectedCategory} />
                    <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
                </div>

                {/* Product detail */}
                {selected && (
                    <div className="mb-6">
                        <Results product={selected} onClear={() => setSelected(null)} />
                    </div>
                )}

                {/* History */}
                {!selected && <SearchHistory history={history} historyItems={historyItems} onSelectProduct={handleSelectProduct} onDeleteItem={removeFromHistory} onClearAll={clearHistory} />}

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 py-3 text-center">
                    <p className="text-[11px] text-zinc-700">
                        by{" "}
                        <a href="https://github.com/mihaissh" target="_blank" rel="noopener noreferrer"
                           className="text-zinc-500 hover:text-amber-400 transition-colors">
                            mihaissh
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
