import { Moon, Sun, Calculator, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "search" | "calculator";

interface Props {
    theme: "light" | "dark";
    onToggleTheme: () => void;
    view: View;
    onToggleView: () => void;
}

const LABELS: Record<View, string> = {
    search: "cautare produse",
    calculator: "calcul rest",
};

export default function Header({ theme, onToggleTheme, view, onToggleView }: Props) {
    return (
        <header className="pt-8 sm:pt-12 pb-4 flex items-center justify-between animate-slide-down">
            <div className="flex items-center gap-3">
                <img
                    src="/romstal-logo.png"
                    alt="Romstal"
                    className="h-8 sm:h-9 w-auto dark:brightness-0 dark:invert dark:opacity-90"
                />
                <span className="h-5 w-px bg-border" />
                <span className="text-[11px] font-mono font-medium text-muted-foreground tracking-widest uppercase">
                    {LABELS[view]}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleView}
                    className="rounded-full"
                    aria-label={view === "search" ? "Deschide calculator rest" : "Inapoi la cautare"}
                >
                    {view === "search" ? <Calculator className="size-[18px]" /> : <ArrowLeft className="size-[18px]" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleTheme}
                    className="rounded-full"
                    aria-label="Schimba tema"
                >
                    {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                </Button>
            </div>
        </header>
    );
}
