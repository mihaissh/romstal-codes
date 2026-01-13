import { useState, useMemo, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import Results from "./components/Results";
import SearchHistory from "./components/SearchHistory";
import Header from "./components/Header";
import StoreSelector from "./components/StoreSelector";
import StorageSelector, { type StorageLocation } from "./components/StorageSelector";
import { useSearchHistory } from "./hooks/useSearchHistory";
import products1bn1Deposit from "./stoc_1bn1_deposit.json";
import products1bn1Expo from "./stoc_1bn1_expo.json";
import products1bv1Deposit from "./stoc_1bv1_deposit.json";
import products1bv1Expo from "./stoc_1bv1_expo.json";
import type { Product } from "./types/Product";
import { createSearchIndex } from "./utils/searchIndex";
import { searchCache } from "./utils/searchCache";
import { clearInvertedIndex } from "./utils/searchUtils";

type StoreCode = "1BN1" | "1BV1";

export default function App() {
    const [query, setQuery] = useState<string>("");
    const [selected, setSelected] = useState<Product | null>(null);
    const [currentStore, setCurrentStore] = useState<StoreCode>("1BN1");
    const [currentStorage, setCurrentStorage] = useState<StorageLocation>("deposit");
    
    // Determine available storage locations for current store
    const availableStorages = useMemo<StorageLocation[]>(() => {
        if (currentStore === "1BV1") {
            // 1BV1 has both deposit and expo
            return ["deposit", "expo"];
        } else {
            // 1BN1 only has deposit
            return ["deposit"];
        }
    }, [currentStore]);

    // Reset storage to deposit when switching stores if expo is not available
    useEffect(() => {
        if (!availableStorages.includes(currentStorage)) {
            setCurrentStorage("deposit");
        }
    }, [availableStorages, currentStorage]);
    
    const { history, historyItems, addToHistory, removeFromHistory, clearHistory } = useSearchHistory(currentStore);

    // Create search index for faster searching, especially for large datasets like 1BV1
    const products = useMemo(() => {
        let rawProducts: Product[];
        
        if (currentStore === "1BN1") {
            rawProducts = currentStorage === "deposit" 
                ? (products1bn1Deposit as Product[])
                : (products1bn1Expo as Product[]);
        } else {
            rawProducts = currentStorage === "deposit"
                ? (products1bv1Deposit as Product[])
                : (products1bv1Expo as Product[]);
        }
        
        // Create search index for better performance
        // This pre-processes products once instead of on every search
        return createSearchIndex(rawProducts);
    }, [currentStore, currentStorage]);

    const handleSelectProduct = (product: Product) => {
        setSelected(product);
        addToHistory(product);
    };

    const handleStoreSelect = (storeCode: StoreCode) => {
        if (storeCode !== currentStore) {
            setCurrentStore(storeCode);
            setSelected(null);
            setQuery("");
            // Reset storage to deposit when switching stores
            setCurrentStorage("deposit");
            // Clear search cache and inverted index when switching stores
            searchCache.invalidate();
            clearInvertedIndex();
        }
    };

    const handleStorageSelect = (storage: StorageLocation) => {
        if (storage !== currentStorage) {
            setCurrentStorage(storage);
            setSelected(null);
            setQuery("");
            // Clear search cache and inverted index when switching storage
            searchCache.invalidate();
            clearInvertedIndex();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-3 sm:px-4 py-6 sm:py-8 pb-20">
            <div className="w-full max-w-4xl mx-auto">
                <main className="space-y-4 sm:space-y-6">
                    <Header />

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                            <StoreSelector
                                currentStore={currentStore}
                                onStoreSelect={handleStoreSelect}
                            />
                            <StorageSelector
                                currentStorage={currentStorage}
                                onStorageSelect={handleStorageSelect}
                                availableStorages={availableStorages}
                            />
                        </div>
                        <div className="relative">
                            <SearchBar
                                query={query}
                                onChange={setQuery}
                                products={products}
                                onSelect={handleSelectProduct}
                            />
                        </div>
                    </div>

                    {!selected && history.length > 0 && (
                        <SearchHistory
                            history={history}
                            historyItems={historyItems}
                            onSelectProduct={handleSelectProduct}
                            onDeleteItem={removeFromHistory}
                            onClearAll={clearHistory}
                        />
                    )}

                    {selected && (
                        <div className="transition-all duration-500 ease-out">
                            <Results product={selected} onClear={() => setSelected(null)} />
                        </div>
                    )}
                </main>

                <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        created by{" "}
                        <a
                            href="https://github.com/mihaissh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors duration-200 hover:underline decoration-2 underline-offset-2"
                        >
                            mihaissh
                        </a>
                        {" "}
                    </p>
                </footer>
            </div>
        </div>
    );
}