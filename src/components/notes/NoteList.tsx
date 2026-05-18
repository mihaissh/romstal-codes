import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, StickyNote, Plus, FileText, ChevronDown, ChevronRight, MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note, NoteTag, DocumentType } from "@/hooks/useNotes";
import { DOCUMENT_TYPES, DOC_COLORS } from "./NoteModal";

const TAG_COLORS: Record<NoteTag, string> = {
    "platit": "bg-tag-category-bg text-tag-category-text",
    "neplatit": "bg-tag-color-bg text-tag-color-text",
    "livrare curier": "bg-tag-material-bg text-tag-material-text",
    "livrare marfa": "bg-tag-material-bg text-tag-material-text",
    "ridica client": "bg-tag-dimension-bg text-tag-dimension-text",
    "SPEDEX": "bg-primary text-primary-foreground",
    "emisa": "bg-green-500/15 text-green-600 dark:text-green-400",
    "ne emisa": "bg-destructive/15 text-destructive",
};

interface NoteListProps {
    notes: Note[];
    onEdit: (note: Note) => void;
    onDelete: (id: string) => void;
    onCreateClick: () => void;
}

// ─────────────────────────────────────────────────────────────
// Compact Note Card (Linear/GitHub style)
// ─────────────────────────────────────────────────────────────

interface NoteCardProps {
    note: Note;
    onEdit: (note: Note) => void;
    onDelete: (id: string) => void;
}

function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
    return (
        <Card 
            onClick={() => onEdit(note)}
            className={cn(
                "p-3 group relative cursor-pointer transition-colors",
                /* Flat card: no ring/shadow lift; note column header already carries doc-type color */
                "shadow-none ring-0 hover:shadow-none hover:translate-y-0 border border-border/60",
            )}
        >
            {/* Title + ID */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug flex-1 min-w-0">
                    {note.nume}
                </h4>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                    }}
                    className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>

            {/* Doc number */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                    #{note.orderOrInvoice}
                </span>
                {note.updatedAt && (
                    <span className="text-[9px] font-mono text-primary/60 italic">
                        · editat
                    </span>
                )}
            </div>

            {/* Tags */}
            {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.slice(0, 4).map(tag => (
                        <span 
                            key={tag} 
                            className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                TAG_COLORS[tag]
                            )}
                        >
                            {tag}
                        </span>
                    ))}
                    {note.tags.length > 4 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-muted-foreground bg-muted">
                            +{note.tags.length - 4}
                        </span>
                    )}
                </div>
            )}

            {/* Client + Phone (inline, compact) */}
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="truncate flex-1">
                    <span className="opacity-60">→</span> {note.client}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {note.phone_number && (
                        <span title={note.phone_number}>
                            <Phone className="size-3 text-muted-foreground/50" />
                        </span>
                    )}
                    {note.text && (
                        <span title="Are detalii">
                            <MessageSquare className="size-3 text-muted-foreground/50" />
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────
// Main NoteList Component
// ─────────────────────────────────────────────────────────────

export default function NoteList({ notes, onEdit, onDelete, onCreateClick }: NoteListProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const toggleCollapse = (type: string) => {
        setCollapsed(prev => ({ ...prev, [type]: !prev[type] }));
    };

    if (notes.length === 0) {
        return (
            <div className="text-center py-16 border-2 rounded-2xl border-dashed bg-muted/5">
                <div className="size-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <StickyNote className="size-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-bold mb-2">Nu exista note salvate</h3>
                <p className="text-sm text-muted-foreground font-mono max-w-sm mx-auto mb-6">
                    Incepe prin a adauga prima ta nota. Poti clasifica notele dupa tipul de document (Factura, Proforma, etc.) si poti adauga tag-uri de stare.
                </p>
                <Button 
                    onClick={onCreateClick} 
                    className="gap-2 font-bold uppercase tracking-wider h-11 px-6"
                >
                    <Plus className="size-4" />
                    Adauga Prima Nota
                </Button>
            </div>
        );
    }

    const groupedNotes = DOCUMENT_TYPES.reduce((acc, type) => {
        acc[type] = notes.filter(n => (n.documentType || "Factura") === type);
        return acc;
    }, {} as Record<DocumentType, Note[]>);

    return (
        <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-6 snap-x md:items-start w-full">
            {DOCUMENT_TYPES.map((type) => {
                const typeNotes = groupedNotes[type];
                if (typeNotes.length === 0) return null;

                const isCollapsed = collapsed[type];

                return (
                    <div 
                        key={type} 
                        className="flex flex-col md:min-w-[300px] md:w-[300px] shrink-0 snap-start md:h-[calc(100vh-220px)]"
                    >
                        {/* ─── Column Header (Sticky) ─── */}
                        <button
                            type="button"
                            onClick={() => toggleCollapse(type)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-colors hover:opacity-90 select-none mb-3 shrink-0",
                                DOC_COLORS[type],
                                isCollapsed && "opacity-60"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {isCollapsed ? (
                                    <ChevronRight className="size-3.5 opacity-70" />
                                ) : (
                                    <ChevronDown className="size-3.5 opacity-70" />
                                )}
                                <FileText className="size-3.5 opacity-70" />
                                <h3 className="font-bold uppercase tracking-wider text-xs">
                                    {type}
                                </h3>
                            </div>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-background/60 min-w-[24px] text-center">
                                {typeNotes.length}
                            </span>
                        </button>

                        {/* ─── Scrollable Notes Container ─── */}
                        {!isCollapsed && (
                            <div className="relative flex-1 min-h-0">
                                <div className="h-full overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
                                    <div className="flex flex-col gap-2 pb-4">
                                        {typeNotes.map((note) => (
                                            <NoteCard
                                                key={note.id}
                                                note={note}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Fade gradient at bottom indicating more content */}
                                {typeNotes.length > 5 && (
                                    <div className="absolute bottom-0 left-0 right-1 h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
