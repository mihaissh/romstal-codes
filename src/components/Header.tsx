import { Moon, Sun, Calculator, Search, StickyNote, User, LogOut, Settings, Package, ChevronDown, Lock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type View = "search" | "calculator" | "notes" | "profile" | "stoc";

interface Props {
    theme: "light" | "dark";
    onToggleTheme: () => void;
    view: View;
    onViewChange: (view: View) => void;
    user: SupabaseUser | null;
    profile: { full_name: string | null; avatar_url: string | null } | null;
    onLoginClick: () => void;
    onLogout: () => void;
}

const LABELS: Record<View, string> = {
    search: "cautare produse",
    calculator: "calcul rest",
    notes: "note",
    profile: "profil utilizator",
    stoc: "situatie stoc",
};

export default function Header({ theme, onToggleTheme, view, onViewChange, user, profile, onLoginClick, onLogout }: Props) {
    return (
        <TooltipProvider>
            <header className="pt-8 sm:pt-12 pb-4 space-y-6 animate-slide-down">
                <div className="flex items-center justify-between">
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
                            onClick={onToggleTheme}
                            className="rounded-full"
                            aria-label="Schimba tema"
                        >
                            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                        </Button>
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={cn(
                                        buttonVariants({ variant: "ghost", size: "sm" }),
                                        "rounded-full gap-2 text-primary hover:text-primary/80 px-3 font-bold"
                                    )}
                                >
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="size-[18px] rounded-full object-cover" />
                                    ) : (
                                        <User className="size-[18px]" />
                                    )}
                                    <span className="text-[11px] font-mono uppercase tracking-tight">
                                        {profile?.full_name || user.email?.split('@')[0]}
                                    </span>
                                    <ChevronDown className="size-3 opacity-50" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                                            Contul meu
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onViewChange("profile")} className="cursor-pointer">
                                            <Settings className="mr-2 size-4" />
                                            <span>Editeaza Profil</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onViewChange("stoc")} className="cursor-pointer">
                                            <Package className="mr-2 size-4" />
                                            <span>Situatie Stoc</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <LogOut className="mr-2 size-4" />
                                        <span>Iesire</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onLoginClick}
                                className="rounded-full gap-2 text-muted-foreground hover:text-primary px-3"
                            >
                                <User className="size-[18px]" />
                                <span className="text-[11px] font-mono uppercase tracking-wider">Login</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex p-1 bg-muted/50 rounded-xl gap-1">
                    <button
                        onClick={() => onViewChange("search")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all",
                            view === "search" 
                                ? "bg-background text-primary shadow-sm font-bold" 
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Search className="size-3.5" />
                        <span className="hidden sm:inline">Cautare</span>
                    </button>
                    <button
                        onClick={() => onViewChange("calculator")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all",
                            view === "calculator" 
                                ? "bg-background text-primary shadow-sm font-bold" 
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Calculator className="size-3.5" />
                        <span className="hidden sm:inline">Calculator</span>
                    </button>
                    
                    {user ? (
                        <button
                            onClick={() => onViewChange("notes")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all",
                                view === "notes" 
                                    ? "bg-background text-primary shadow-sm font-bold" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <StickyNote className="size-3.5" />
                            <span className="hidden sm:inline">Note</span>
                        </button>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all opacity-40 grayscale cursor-not-allowed bg-repeating-linear-gradient"
                                >
                                    <Lock className="size-3.5" />
                                    <span className="hidden sm:inline">Note</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-mono text-[10px] uppercase tracking-widest">
                                In lucru / Login necesar
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </header>
        </TooltipProvider>
    );
}
