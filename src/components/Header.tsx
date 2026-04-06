import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    theme: "light" | "dark";
    onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: Props) {
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
                    cautare produse
                </span>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className="rounded-full"
            >
                {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </Button>
        </header>
    );
}
