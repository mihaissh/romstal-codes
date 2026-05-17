import { Moon, Sun, Calculator, Search, StickyNote, User, LogOut, Settings, Package, ChevronDown, Lock, Info, Scan, Globe } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import HeaderAction from "./HeaderAction";
import {
    TooltipProvider,
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

export type View = "search" | "calculator" | "notes" | "profile" | "stoc" | "scan";

interface Props {
    theme: "light" | "dark";
    onToggleTheme: () => void;
    view: View;
    onViewChange: (view: View) => void;
    user: SupabaseUser | null;
    profile: { full_name: string | null; avatar_url: string | null } | null;
    onLoginClick: () => void;
    onLogout: () => void;
    onAboutClick: () => void;
}

const LABELS: Record<View, string> = {
    search: "cautare produse",
    calculator: "calcul rest",
    notes: "note",
    profile: "profil utilizator",
    stoc: "situatie stoc",
    scan: "scanare cod",
};

type TabConfig = {
    view: View;
    label: string;
    icon: React.ReactNode;
    requiresAuth?: boolean;
    lockedReason?: string;
};

const TABS: TabConfig[] = [
    { view: "search", label: "Cautare", icon: <Search className="size-3.5" /> },
    { view: "calculator", label: "Calculator", icon: <Calculator className="size-3.5" /> },
    {
        view: "scan",
        label: "Scan",
        icon: <Scan className="size-3.5" />,
        requiresAuth: true,
        lockedReason: "Login necesar",
    },
    {
        view: "notes",
        label: "Note",
        icon: <StickyNote className="size-3.5" />,
        requiresAuth: true,
        lockedReason: "In lucru / Login necesar",
    },
];

interface NavTabProps {
    tab: TabConfig;
    activeView: View;
    locked: boolean;
    onClick: () => void;
}

function NavTab({ tab, activeView, locked, onClick }: NavTabProps) {
    const baseTab =
        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all border border-transparent";

    if (locked) {
        return (
            <div className="flex-1 relative group">
                <button
                    type="button"
                    disabled
                    className={cn(
                        baseTab,
                        "w-full opacity-40 grayscale cursor-not-allowed bg-repeating-linear-gradient",
                    )}
                >
                    <Lock className="size-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-foreground text-background text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-md whitespace-nowrap shadow-xl">
                    {tab.lockedReason ?? "Login necesar"}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-foreground" />
                </div>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                baseTab,
                activeView === tab.view
                    ? "bg-background text-primary shadow-sm font-bold border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50 hover:border-border/50",
            )}
        >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
        </button>
    );
}

export default function Header({ theme, onToggleTheme, view, onViewChange, user, profile, onLoginClick, onLogout, onAboutClick }: Props) {
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
                        <HeaderAction
                            icon={<Globe className="size-[18px]" />}
                            label="Romstal Website"
                            description="catre romstal"
                            onClick={() => window.open("https://www.romstal.ro/", "_blank")}
                            className="text-muted-foreground hover:text-primary"
                        />

                        <HeaderAction
                            icon={theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                            label="Schimba tema"
                            description={theme === "dark" ? "Tema luminoasa" : "Tema intunecata"}
                            onClick={onToggleTheme}
                        />
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={cn(
                                        buttonVariants({ variant: "outline", size: "sm" }),
                                        "rounded-full gap-2 text-primary hover:text-primary/80 px-3 font-bold bg-background/50 shadow-sm"
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
                                variant="outline"
                                size="sm"
                                onClick={onLoginClick}
                                className="rounded-full gap-2 text-muted-foreground hover:text-primary px-3 bg-background/50 shadow-sm"
                            >
                                <User className="size-[18px]" />
                                <span className="text-[11px] font-mono uppercase tracking-wider">Login</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex p-1 bg-muted/50 rounded-xl gap-1">
                    {TABS.map((tab) => (
                        <NavTab
                            key={tab.view}
                            tab={tab}
                            activeView={view}
                            locked={Boolean(tab.requiresAuth) && !user}
                            onClick={() => onViewChange(tab.view)}
                        />
                    ))}
                </div>
            </header>
        </TooltipProvider>
    );
}
