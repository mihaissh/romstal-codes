import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowUpRight, Search } from "lucide-react";

export default function Stoc() {
    // This is a placeholder for the Stoc page
    return (
        <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest">Total Produse</p>
                                <h3 className="text-2xl font-bold mt-1">72,040</h3>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Package className="size-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-tag-category-bg/10 border-tag-category-bg/20">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest">Actualizari Azi</p>
                                <h3 className="text-2xl font-bold mt-1">+124</h3>
                            </div>
                            <div className="p-2 bg-tag-category-bg/20 rounded-lg">
                                <ArrowUpRight className="size-5 text-tag-category-text" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
                        <Search className="size-4" />
                        Sumar Stoc Magazin
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">BN</div>
                                <div>
                                    <p className="text-xs font-bold">1BN1 - Deposit</p>
                                    <p className="text-[10px] text-muted-foreground">Baneasa</p>
                                </div>
                            </div>
                            <Badge variant="outline">34,521 items</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">BV</div>
                                <div>
                                    <p className="text-xs font-bold">1BV1 - Deposit</p>
                                    <p className="text-[10px] text-muted-foreground">Brasov</p>
                                </div>
                            </div>
                            <Badge variant="outline">37,519 items</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center py-8 opacity-40">
                <Package className="size-12 mx-auto mb-3" />
                <p className="text-sm font-mono">Modulul de gestionare stoc este in curs de dezvoltare.</p>
            </div>
        </div>
    );
}
