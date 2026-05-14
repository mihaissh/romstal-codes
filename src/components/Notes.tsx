import { useState } from "react";
import { useNotes, type Note, type NoteTag } from "@/hooks/useNotes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Trash2, Plus, StickyNote, Edit2, X, Check, Phone } from "lucide-react";
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
    const [showModal, setShowModal] = useState(false);
    
    // Form state
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
        } else {
            addNote(noteData);
        }

        closeModal();
    };

    const openModal = (note?: Note) => {
        if (note) {
            setEditingId(note.id);
            setNume(note.nume);
            setClient(note.client);
            setOrderOrInvoice(note.orderOrInvoice);
            setPhoneNumber(note.phone_number || "");
            setText(note.text || "");
            setSelectedTags(note.tags);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
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

    const toggleTag = (tag: NoteTag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag) 
                : [...prev, tag]
        );
    };

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <StickyNote className="size-3" />
                    Note Recente ({notes.length})
                    {loading && <span className="animate-pulse text-[9px] lowercase opacity-50">(se incarca...)</span>}
                </h2>
                <div className="flex items-center gap-2">
                    {notes.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearNotes}
                            className="h-8 text-[10px] font-mono uppercase tracking-tighter text-muted-foreground hover:text-destructive"
                        >
                            Sterge Tot
                        </Button>
                    )}
                    <Button 
                        onClick={() => openModal()} 
                        size="sm" 
                        className="h-8 gap-2 font-bold uppercase text-[10px] tracking-wider"
                    >
                        <Plus className="size-3.5" />
                        Creaza Nota
                    </Button>
                </div>
            </div>

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest">
                                {editingId ? <Edit2 className="size-4 text-primary" /> : <Plus className="size-4 text-primary" />}
                                {editingId ? "Editeaza Nota" : "Adauga Nota Noua"}
                            </CardTitle>
                            <CardAction>
                                <Button variant="ghost" size="icon-sm" onClick={closeModal} className="rounded-full">
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

                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" type="button" onClick={closeModal} className="flex-1">
                                        Anuleaza
                                    </Button>
                                    <Button type="submit" className="flex-[2] gap-2" disabled={!nume || !client || !orderOrInvoice}>
                                        {editingId ? <Check className="size-4" /> : <Plus className="size-4" />}
                                        {editingId ? "Salveaza Modificarile" : "Adauga Nota"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Notes List */}
            <div className="space-y-4">
                {notes.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl border-dashed bg-muted/10">
                        <StickyNote className="size-8 mx-auto mb-3 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground font-mono">Nu exista note salvate.</p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openModal()} 
                            className="mt-4 gap-2 font-mono text-[10px] uppercase tracking-widest"
                        >
                            <Plus className="size-3" />
                            Prima Nota
                        </Button>
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
                                            onClick={() => openModal(note)}
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
