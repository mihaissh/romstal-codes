import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, StickyNote, Edit2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note, NoteTag } from "@/hooks/useNotes";

const TAG_COLORS: Record<NoteTag, string> = {
    "platit": "bg-tag-category-bg text-tag-category-text border-tag-category-text/20",
    "neplatit": "bg-tag-color-bg text-tag-color-text border-tag-color-text/20",
    "livrare curier": "bg-tag-material-bg text-tag-material-text border-tag-material-text/20",
    "livrare marfa": "bg-tag-material-bg text-tag-material-text border-tag-material-text/20",
    "ridica client": "bg-tag-dimension-bg text-tag-dimension-text border-tag-dimension-text/20",
    "SPEDEX": "bg-primary text-primary-foreground border-primary/20",
};

interface NoteListProps {
    notes: Note[];
    onEdit: (note: Note) => void;
    onDelete: (id: string) => void;
    onCreateClick: () => void;
}

export default function NoteList({ notes, onEdit, onDelete, onCreateClick }: NoteListProps) {
    if (notes.length === 0) {
        return (
            <div className="text-center py-12 border rounded-xl border-dashed bg-muted/10">
                <StickyNote className="size-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground font-mono">Nu exista note salvate.</p>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onCreateClick} 
                    className="mt-4 gap-2 font-mono text-[10px] uppercase tracking-widest"
                >
                    <Plus className="size-3" />
                    Prima Nota
                </Button>
            </div>
        );
    }

    return (
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
                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onEdit(note)}
                                className="size-8 rounded-full border-border bg-background/80 text-muted-foreground hover:text-primary hover:border-primary/30 shadow-sm"
                            >
                                <Edit2 className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onDelete(note.id)}
                                className="size-8 rounded-full border-border bg-background/80 text-muted-foreground hover:text-destructive hover:border-destructive/30 shadow-sm"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
