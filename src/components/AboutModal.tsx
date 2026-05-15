import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Info, Code2, Database, Zap, Layout, Sparkles } from "lucide-react";

interface Props {
    onClose: () => void;
}

export default function AboutModal({ onClose }: Props) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Info className="size-5" />
                        Despre Proiect
                    </CardTitle>
                    <CardAction>
                        <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full">
                            <X className="size-4" />
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {/* Stack Section */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70 font-mono">
                            <Code2 className="size-4 text-blue-500" />
                            Tehnologii (Stack)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <TechBadge icon={<Layout className="size-3" />} label="React 19" color="bg-blue-500/10 text-blue-600 border-blue-500/20" />
                            <TechBadge icon={<Zap className="size-3" />} label="Vite + TS" color="bg-yellow-500/10 text-yellow-600 border-yellow-500/20" />
                            <TechBadge icon={<Sparkles className="size-3" />} label="Tailwind 4" color="bg-cyan-500/10 text-cyan-600 border-cyan-500/20" />
                            <TechBadge icon={<Database className="size-3" />} label="Supabase" color="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" />
                        </div>
                    </section>

                    {/* Logic Section */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/70 font-mono">
                            <Sparkles className="size-4 text-purple-500" />
                            Cum funcționează
                        </div>
                        <div className="space-y-3">
                            <LogicItem 
                                title="Căutare Inteligentă" 
                                description="Algoritm hibrid care prioritizează codurile de produs și folosește tokenizare pentru denumiri."
                                icon={<Zap className="size-4 text-amber-500" />}
                            />
                            <LogicItem 
                                title="Gestiune Multi-Store" 
                                description="Sistem dinamic de filtrare a stocurilor în funcție de locația selectată (1BN1, 1BV1)."
                                icon={<Layout className="size-4 text-indigo-500" />}
                            />
                            <LogicItem 
                                title="Productivitate" 
                                description="Calculator de rest integrat și sistem de note persistente pentru eficientizarea fluxului de lucru."
                                icon={<Code2 className="size-4 text-rose-500" />}
                            />
                        </div>
                    </section>

                    <div className="pt-2 border-t border-border/50">
                        <p className="text-[11px] text-center text-muted-foreground italic">
                            Romstal Companion — creat pentru a simplifica procesul de identificare a produselor în depozite.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function TechBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${color}`}>
            {icon}
            {label}
        </div>
    );
}

function LogicItem({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="mt-0.5">{icon}</div>
            <div className="space-y-1">
                <h4 className="text-xs font-bold leading-none">{title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
