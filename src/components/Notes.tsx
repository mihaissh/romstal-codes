import { useState } from "react";
import { useNotes, type Note, type NoteTag } from "@/hooks/useNotes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, StickyNote, Edit2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_TAGS: NoteTag[] = ["platit", "neplatit", "livrare curier", "livrare marfa", "ridica client", "SPEDEX"];

const TAG_COLORS: Record<NoteTag, string> = {
    "platit": "bg-tag-category-bg text-tag-category-text border-tag-category-text/20",
    "neplatit": "bg-tag-color-bg text-tag-color-text border-tag-color-text/20",
    "livrare curier": "bg-tag-material-bg text-tag-material-text border-tag-material-text/20",
    "livrare marfa": "bg-tag-material-bg text-tag-material-text border-tag-material-text/20",
    "ridica client": "bg-tag-dimension-bg text-tag-dimension-text border-tag-dimension-text/20",
    "SPEDEX": "bg-primary text-primary-foreground border-primary/20",
};

export default function Notes() {
    const { notes, loading, addNote, updateNote, deleteNote, clearNotes } = useNotes();
    const [nume, setNume] = useState("");
    const [client, setClient] = useState("");
    const [orderOrInvoice, setOrderOrInvoice] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [text, setText] = useState("");
    const [selectedTags, setSelectedTags] = useState<NoteTag[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
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

        if (editingId) {
            updateNote(editingId, noteData);
            setEditingId(null);
        } else {
            addNote(noteData);
        }

        resetForm();
    };

    const resetForm = () => {
        setNume("");
        setClient("");
        setOrderOrInvoice("");
        setPhoneNumber("");
        setText("");
        setSelectedTags([]);
        setEditingId(null);
    };

    const handleEdit = (note: Note) => {
        setEditingId(note.id);
        setNume(note.nume);
        setClient(note.client);
        setOrderOrInvoice(note.orderOrInvoice);
        setPhoneNumber(note.phone_number || "");
        setText(note.text || "");
        setSelectedTags(note.tags);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleTag = (tag: NoteTag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag) 
                : [...prev, tag]
        );
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <Card className={cn(
                "p-4 border-dashed transition-colors",
                editingId ? "bg-primary/5 border-primary/50" : "bg-muted/30"
            )}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            {editingId ? <Edit2 className="size-3 text-primary" /> : <Plus className="size-3" />}
                            {editingId ? "Editeaza Nota" : "Adauga Nota Noua"}
                        </h3>
                        {editingId && (
                            <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-[10px] uppercase font-mono">
                                <X className="size-3 mr-1" /> Anuleaza
                            </Button>
                        )}
                    </div>

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
                            <Input
                                placeholder="07xx xxx xxx"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                type="tel"
                            />
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
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={!nume || !client || !orderOrInvoice}>
                        {editingId ? <Check className="size-4" /> : <Plus className="size-4" />}
                        {editingId ? "Salveaza Modificarile" : "Adauga Nota"}
                    </Button>
                </form>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <StickyNote className="size-3" />
                        Note Recente ({notes.length})
                        {loading && <span className="animate-pulse text-[9px] lowercase opacity-50">(se incarca...)</span>}
                    </h2>
                    {notes.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearNotes}
                            className="h-7 text-[10px] font-mono uppercase tracking-tighter text-muted-foreground hover:text-destructive"
                        >
                            Sterge Tot
                        </Button>
                    )}
                </div>

                {notes.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl border-dashed bg-muted/10">
                        <StickyNote className="size-8 mx-auto mb-3 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground font-mono">Nu exista note salvate.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {notes.map((note) => (
                            <Card key={note.id} className="p-4 group relative overflow-hidden">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold">{note.nume}</span>
                                            <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                {note.orderOrInvoice}
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {note.tags.map(tag => (
                                                    <span 
                                                        key={tag} 
                                                        className={cn(
                                                            "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border",
                                                            TAG_COLORS[tag]
                                                        )}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Client: <span className="text-foreground">{note.client}</span>
                                            {note.phone_number && (
                                                <>
                                                    <span className="mx-2 opacity-30">|</span>
                                                    Tel: <span className="text-foreground font-mono">{note.phone_number}</span>
                                                </>
                                            )}
                                        </p>
                                        {note.text && (
                                            <p className="text-xs mt-2 text-muted-foreground whitespace-pre-wrap border-l-2 border-primary/20 pl-2">
                                                {note.text}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 pt-1">
                                            <p className="text-[9px] font-mono text-muted-foreground/50">
                                                {new Date(note.createdAt).toLocaleString()}
                                            </p>
                                            {note.updatedAt && (
                                                <p className="text-[9px] font-mono text-primary/40 italic">
                                                    (editat)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(note)}
                                            className="size-8 text-muted-foreground hover:text-primary"
                                        >
                                            <Edit2 className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteNote(note.id)}
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
