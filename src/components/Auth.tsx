import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { X, LogIn, Mail, Lock, Loader2 } from "lucide-react";

interface Props {
    onClose: () => void;
}

export default function Auth({ onClose }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.error("Login error details:", error);
                setError(error.message);
            } else {
                onClose();
            }
        } catch (err) {
            console.error("Unexpected auth error:", err);
            setError("A aparut o eroare neasteptata.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md shadow-2xl animate-scale-in">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LogIn className="size-5 text-primary" />
                        Autentificare
                    </CardTitle>
                    <CardAction>
                        <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full">
                            <X className="size-4" />
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Utilizator / Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Utilizator sau email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Parola</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 animate-shake">
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full gap-2 h-11" disabled={loading}>
                            {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                            Intra in cont
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
