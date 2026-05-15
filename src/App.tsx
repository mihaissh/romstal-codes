import { useState, useMemo, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import Results from "@/components/Results";
import SearchHistory from "@/components/SearchHistory";
import Header from "@/components/Header";
import StoreSelector from "@/components/StoreSelector";
import StorageSelector, { type StorageLocation } from "@/components/StorageSelector";
import ChangeCalculator from "@/components/ChangeCalculator";
import Notes from "@/components/Notes";
import Profile from "@/components/Profile";
import Stoc from "@/components/Stoc";
import Auth from "@/components/Auth";
import AboutModal from "@/components/AboutModal";
import Scanner from "@/components/Scanner";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { searchSupabase } from "@/utils/search";
import type { Product } from "@/types/Product";

type StoreCode = "1BN1" | "1BV1";
type View = "search" | "calculator" | "notes" | "profile" | "stoc" | "scan";

export default function App() {
    const { theme, toggle: toggleTheme } = useTheme();
    const { user, profile, signOut } = useAuth();
    const [view, setView] = useState<View>("search");
    const [showAuth, setShowAuth] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    const handleLogout = async () => {
        await signOut();
        setView("search");
    };

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Product | null>(null);
    const [currentStore, setCurrentStore] = useState<StoreCode>("1BN1");
    const [currentStorage, setCurrentStorage] = useState<StorageLocation>("deposit");

    const handleViewChange = (newView: View) => setView(newView);

    const availableStorages = useMemo<StorageLocation[]>(() =>
        currentStore === "1BV1" ? ["deposit", "expo"] : ["deposit"],
    [currentStore]);

    useEffect(() => {
        if (!availableStorages.includes(currentStorage)) setCurrentStorage("deposit");
    }, [availableStorages, currentStorage]);

    const { history, historyItems, addToHistory, removeFromHistory, clearHistory } = useSearchHistory(currentStore);

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
    };

    const handleStorageSelect = (storage: StorageLocation) => {
        if (storage === currentStorage) return;
        setCurrentStorage(storage);
        setSelected(null);
        setQuery("");
    };

    const handleScanSuccess = async (code: string) => {
        const results = await searchSupabase(code, { maxCodeResults: 1 });
        if (results.codeResults.length > 0) {
            handleSelectProduct(results.codeResults[0].product);
            setView("search");
        } else {
            setQuery(code);
            setView("search");
        }
    };

    return (
        <div className="min-h-screen px-5 sm:px-6 flex flex-col">
            <div className="max-w-2xl mx-auto flex-1 w-full pb-10">
                <Header 
                    theme={theme} 
                    onToggleTheme={toggleTheme} 
                    view={view} 
                    onViewChange={handleViewChange}
                    user={user}
                    profile={profile}
                    onLoginClick={() => setShowAuth(true)}
                    onLogout={handleLogout}
                    onAboutClick={() => setShowAbout(true)}
                />

                {showAuth && <Auth onClose={() => setShowAuth(false)} />}
                {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

                {view === "search" && (
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
                            <SearchBar query={query} onChange={setQuery} onSelect={handleSelectProduct} category={null} />
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
                )}

                {view === "calculator" && (
                    <div key="calculator-view" className="pt-2">
                        <ChangeCalculator />
                    </div>
                )}

                {view === "notes" && (
                    <div key="notes-view" className="pt-2">
                        <Notes />
                    </div>
                )}

                {view === "profile" && (
                    <div key="profile-view" className="pt-2">
                        <Profile />
                    </div>
                )}

                {view === "stoc" && (
                    <div key="stoc-view" className="pt-2">
                        <Stoc />
                    </div>
                )}

                {view === "scan" && (
                    <div key="scan-view" className="pt-2">
                        <Scanner onScanSuccess={handleScanSuccess} />
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-6 text-center">
                <p className="text-[10px] font-mono text-muted-foreground/30 tracking-wider">
                    built by{" "}
                    <a href="https://github.com/mihaissh" target="_blank" rel="noopener noreferrer"
                       className="text-muted-foreground/50 hover:text-primary transition-colors underline underline-offset-2 decoration-border hover:decoration-primary">
                        mihaissh
                    </a>
                </p>
            </footer>
        </div>
    );
}
