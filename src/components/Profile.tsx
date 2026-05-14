import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Camera, Save, Loader2 } from "lucide-react";

export default function Profile() {
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    async function getProfile() {
        try {
            setLoading(true);
            const { data, error, status } = await supabase
                .from('profiles')
                .select(`full_name, avatar_url`)
                .eq('id', user?.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setFullName(data.full_name || "");
                setAvatarUrl(data.avatar_url || "");
            }
        } catch (error) {
            console.error('Error loading user data!', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setSaving(true);
            const updates = {
                id: user?.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            refreshProfile();
            alert('Profil actualizat cu succes!');
        } catch (error) {
            console.error('Error updating the profile!', error);
            alert('Eroare la actualizarea profilului.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-up">
            <Card className="overflow-hidden">
                <CardHeader className="bg-primary/5 pb-8">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group">
                            <div className="size-24 rounded-full bg-muted border-4 border-background overflow-hidden flex items-center justify-center shadow-lg">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                                ) : (
                                    <User className="size-12 text-muted-foreground" />
                                )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                <Camera className="size-6 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{fullName || user?.email?.split('@')[0]}</h2>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Nume Complet</label>
                        <Input
                            placeholder="Numele tau"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">URL Foto Profil</label>
                        <Input
                            placeholder="https://exemplu.ro/foto.jpg"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={updateProfile} 
                        className="w-full gap-2 mt-2" 
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Salveaza Modificarile
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
