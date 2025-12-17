import { useState } from "react";
import SearchBar from "./components/SearchBar";
import Results from "./components/Results";
import SearchHistory from "./components/SearchHistory";
import { useSearchHistory } from "./hooks/useSearchHistory";
import products from "./stoc_1bn1.json";
import type { Product } from "./types/Product";

export default function App() {
    const [query, setQuery] = useState<string>("");
    const [selected, setSelected] = useState<Product | null>(null);
    const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

    const handleSelectProduct = (product: Product) => {
        setSelected(product);
        addToHistory(product);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8 pb-20">
            <div className="w-full max-w-4xl mx-auto">
                <main className="space-y-6">
                    <SearchBar
                        query={query}
                        onChange={setQuery}
                        products={products as Product[]}
                        onSelect={handleSelectProduct}
                    />

                    {!selected && history.length > 0 && (
                        <SearchHistory
                            history={history}
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