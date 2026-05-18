import { useState, useMemo, useEffect, Suspense, lazy } from "react";
import { Info, Loader2 } from "lucide-react";
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
import type { ScannedItem } from "@/components/scanner/ScannedList";
import ScannedList from "@/components/scanner/ScannedList";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { searchSupabase } from "@/utils/search";
import type { Product } from "@/types/Product";
import type { FilialaCode } from "@/types/filiala";

const Scanner = lazy(() => import("@/components/Scanner"));

type View = "search" | "calculator" | "notes" | "profile" | "stoc" | "scan";

export default function App() {
    const { theme, toggle: toggleTheme } = useTheme();
    const { user, profile, signOut } = useAuth();
    const [view, setView] = useState<View>("search");
    const [showAuth, setShowAuth] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        const isFirstLoad = !sessionStorage.getItem("app_loaded");
        
        if (isFirstLoad) {
            const timer = setTimeout(() => {
                setIsAppReady(true);
                sessionStorage.setItem("app_loaded", "true");
                const loader = document.getElementById("initial-loader");
                if (loader) {
                    loader.style.opacity = "0";
                    setTimeout(() => loader.remove(), 500);
                }
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            setIsAppReady(true);
            const loader = document.getElementById("initial-loader");
            if (loader) loader.remove();
        }
    }, []);

    const handleLogout = async () => {
        await signOut();
        setView("search");
    };

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Product | null>(null);
    const [currentStore, setCurrentStore] = useState<FilialaCode>("1BN1");
    const [currentStorage, setCurrentStorage] = useState<StorageLocation>("deposit");
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [scanMessage, setScanMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

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

    const handleStoreSelect = (storeCode: FilialaCode) => {
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
        setScanMessage({ text: `Cautare cod ${code}...`, type: "info" });
        const results = await searchSupabase(code, { maxCodeResults: 1, exactCodeOnly: true });
        if (results.codeResults.length > 0) {
            const product = results.codeResults[0].product;
            setScannedItems((prev) => {
                const existing = prev.find((item) => item.product.code === product.code);
                if (existing) {
                    return prev.map((item) =>
                        item.product.code === product.code
                            ? { ...item, count: item.count + 1 }
                            : item
                    );
                }
                return [{ product, count: 1 }, ...prev];
            });
            setScanMessage({ text: `Adaugat: ${product.name}`, type: "success" });
        } else {
            setScanMessage({ text: `Produsul cu codul ${code} nu a fost gasit.`, type: "error" });
        }
        
        setTimeout(() => setScanMessage(null), 3000);
    };

    const updateScannedCount = (code: string, count: number) => {
        setScannedItems((prev) =>
            prev.map((item) => (item.product.code === code ? { ...item, count } : item))
        );
    };

    const removeScannedItem = (code: string) => {
        setScannedItems((prev) => prev.filter((item) => item.product.code !== code));
    };

    if (!isAppReady) return null;

    return (
        <div className="min-h-screen px-5 sm:px-6 flex flex-col">
            <div className={`mx-auto flex-1 w-full pb-10 transition-all duration-300 ${view === 'notes' || view === 'stoc' ? 'max-w-[1400px]' : 'max-w-2xl'}`}>
                <Header 
                    theme={theme} 
                    onToggleTheme={toggleTheme} 
                    view={view} 
                    onViewChange={handleViewChange}
                    user={user}
                    profile={profile}
                    onLoginClick={() => setShowAuth(true)}
                    onLogout={handleLogout}
                />

                {showAuth && <Auth onClose={() => setShowAuth(false)} />}
                {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

                {view === "search" && (
                    <div key="search-view">
                        <div className="flex items-center gap-2 mb-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
                            <StoreSelector currentStore={currentStore} onStoreSelect={handleStoreSelect} />
                            <StorageSelector currentStorage={currentStorage} onStorageSelect={handleStorageSelect} availableStorages={availableStorages} />
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

                        <div className="relative z-50 mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
                            <SearchBar query={query} onChange={setQuery} onSelect={handleSelectProduct} category={null} />
                        </div>

                        {selected && (
                            <div className="mb-8">
                                <Results product={selected} onClear={() => setSelected(null)} />
                            </div>
                        )}

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
                        <Stoc store={currentStore} onStoreSelect={handleStoreSelect} />
                    </div>
                )}

                {view === "scan" && (
                    <div key="scan-view" className="pt-2">
                        <Suspense fallback={
                            <div className="flex flex-col items-center justify-center p-10 bg-card rounded-xl border-2">
                                <Loader2 className="size-8 text-primary animate-spin mb-4" />
                                <p className="text-sm text-muted-foreground font-mono">Incarcare modul scanner...</p>
                            </div>
                        }>
                            <Scanner onScanSuccess={handleScanSuccess} />
                        </Suspense>
                        {scanMessage && (
                            <div className={`mt-4 p-3 rounded-xl border text-sm animate-fade-up ${
                                scanMessage.type === "error" ? "bg-destructive/10 border-destructive/20 text-destructive" :
                                scanMessage.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" :
                                "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                            }`}>
                                {scanMessage.text}
                            </div>
                        )}
                        <ScannedList 
                            items={scannedItems} 
                            onUpdateCount={updateScannedCount} 
                            onRemove={removeScannedItem} 
                        />
                    </div>
                )}
            </div>

            <footer className="py-6 text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                    <button 
                        onClick={() => setShowAbout(true)}
                        className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest"
                    >
                        <Info className="size-3" />
                        Despre Proiect
                    </button>
                    <span className="size-1 rounded-full bg-border" />
                    <p className="text-[10px] font-mono text-muted-foreground/30 tracking-wider">
                        built by{" "}
                        <a href="https://github.com/mihaissh" target="_blank" rel="noopener noreferrer"
                           className="text-muted-foreground/50 hover:text-primary transition-colors underline underline-offset-2 decoration-border hover:decoration-primary">
                            mihaissh
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
