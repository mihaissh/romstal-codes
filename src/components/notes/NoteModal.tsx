import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Plus, Edit2, X, Check, Phone, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note, NoteTag } from "@/hooks/useNotes";

const AVAILABLE_TAGS: NoteTag[] = ["platit", "neplatit", "livrare curier", "livrare marfa", "ridica client", "SPEDEX"];

const TAG_COLORS: Record<NoteTag, string> = {
    "platit": "bg-tag-category-bg text-tag-category-text border-tag-category-text/20",
    "neplatit": "bg-tag-color-bg text-tag-color-text border-tag-color-text/20",
    "livrare curier": "bg-tag-material-bg text-tag-material-text border-tag-material-text/20",
    "livrare marfa": "bg-tag-material-bg text-tag-material-text border-tag-material-text/20",
    "ridica client": "bg-tag-dimension-bg text-tag-dimension-text border-tag-dimension-text/20",
    "SPEDEX": "bg-primary text-primary-foreground border-primary/20",
};

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (noteData: any) => Promise<void>;
    editingNote: Note | null;
    error: string | null;
}

export default function NoteModal({ isOpen, onClose, onSubmit, editingNote, error: externalError }: NoteModalProps) {
    const [nume, setNume] = useState("");
    const [client, setClient] = useState("");
    const [orderOrInvoice, setOrderOrInvoice] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [text, setText] = useState("");
    const [selectedTags, setSelectedTags] = useState<NoteTag[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editingNote) {
            setNume(editingNote.nume);
            setClient(editingNote.client);
            setOrderOrInvoice(editingNote.orderOrInvoice);
            setPhoneNumber(editingNote.phone_number || "");
            setText(editingNote.text || "");
            setSelectedTags(editingNote.tags);
        } else {
            setNume("");
            setClient("");
            setOrderOrInvoice("");
            setPhoneNumber("");
            setText("");
            setSelectedTags([]);
        }
    }, [editingNote, isOpen]);

    useEffect(() => {
        setError(externalError);
    }, [externalError]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nume || !client || !orderOrInvoice) return;

        const noteData = {
            nume,
            client,
            orderOrInvoice,
            phone_number: phoneNumber.trim() || undefined,
            text: text.trim() || undefined,
            tags: selectedTags,
        };

        await onSubmit(noteData);
    };

    const toggleTag = (tag: NoteTag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag) 
                : [...prev, tag]
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest">
                        {editingNote ? <Edit2 className="size-4 text-primary" /> : <Plus className="size-4 text-primary" />}
                        {editingNote ? "Editeaza Nota" : "Adauga Nota Noua"}
                    </CardTitle>
                    <CardAction>
                        <Button variant="outline" size="icon-sm" onClick={onClose} className="rounded-full bg-background/50 shadow-sm">
                            <X className="size-4" />
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Nume</label>
                                <Input
                                    placeholder="Nume"
                                    value={nume}
                                    onChange={(e) => setNume(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Client</label>
                                <Input
                                    placeholder="Client"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">OL / Factura</label>
                                <Input
                                    placeholder="OL / Factura"
                                    value={orderOrInvoice}
                                    onChange={(e) => setOrderOrInvoice(e.target.value.replace(/[^0-9]/g, ""))}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Telefon (Optional)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="07xx xxx xxx"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        type="tel"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Tag-uri</label>
                            <div className="flex flex-wrap gap-1.5">
                                {AVAILABLE_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "text-[10px] px-2.5 py-1 rounded-md border transition-all font-bold uppercase tracking-tight",
                                            selectedTags.includes(tag)
                                                ? TAG_COLORS[tag]
                                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground ml-1">Text Optional (Detalii)</label>
                            <Textarea
                                placeholder="Adauga mai multe detalii aici..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="min-h-[120px] resize-none"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-shake">
                                <AlertCircle className="size-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={onClose} className="flex-1">
                                Anuleaza
                            </Button>
                            <Button type="submit" className="flex-[2] gap-2" disabled={!nume || !client || !orderOrInvoice}>
                                {editingNote ? <Check className="size-4" /> : <Plus className="size-4" />}
                                {editingNote ? "Salveaza Modificarile" : "Adauga Nota"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
