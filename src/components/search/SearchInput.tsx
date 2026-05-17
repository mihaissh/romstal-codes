import { Search, X, Loader2 } from "lucide-react";

interface SearchInputProps {
    query: string;
    onChange: (query: string) => void;
    onFocus: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    loading: boolean;
    onClear: () => void;
}

export default function SearchInput({ 
    query, 
    onChange, 
    onFocus, 
    onKeyDown, 
    loading, 
    onClear 
}: SearchInputProps) {
    return (
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
            <input
                value={query}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                placeholder="Cauta dupa cod sau descriere..."
                className="w-full h-12 rounded-lg border border-input bg-card pl-11 pr-10 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/70 placeholder:font-normal transition-all focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/10 focus-visible:shadow-lg focus-visible:shadow-primary/5 dark:bg-card/80 dark:backdrop-blur-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {loading && <Loader2 className="size-4 animate-spin text-muted-foreground/40 mr-1" />}
                {query && (
                    <button
                        onClick={onClear}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
