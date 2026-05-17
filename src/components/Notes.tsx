import { useState, useEffect } from "react";
import { useNotes, type Note } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, StickyNote } from "lucide-react";
import NoteModal from "./notes/NoteModal";
import NoteList from "./notes/NoteList";

export default function Notes() {
    const { notes, loading, addNote, updateNote, deleteNote, clearNotes } = useNotes();
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    useEffect(() => {
        if (!showModal) {
            setError(null);
            setEditingNote(null);
        }
    }, [showModal]);

    const handleOpenModal = (note?: Note) => {
        if (note) setEditingNote(note);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSubmit = async (noteData: any) => {
        if (!user) {
            setError("Trebuie sa fii autentificat pentru a adauga note.");
            return;
        }

        try {
            if (editingNote) {
                await updateNote(editingNote.id, noteData);
            } else {
                await addNote(noteData);
            }
            handleCloseModal();
        } catch (err: any) {
            console.error("Note operation error:", err);
            setError(err.message || "A aparut o eroare la salvarea notei.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <StickyNote className="size-3" />
                    Note Recente ({notes.length})
                    {loading && <span className="animate-pulse text-[9px] lowercase opacity-50">(se incarca...)</span>}
                </h2>
                <div className="flex items-center gap-2">
                    {notes.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearNotes}
                            className="h-8 text-[10px] font-mono uppercase tracking-tighter text-muted-foreground hover:text-destructive bg-background/50 shadow-sm"
                        >
                            Sterge Tot
                        </Button>
                    )}
                    <Button 
                        onClick={() => handleOpenModal()} 
                        size="sm" 
                        className="h-8 gap-2 font-bold uppercase text-[10px] tracking-wider"
                    >
                        <Plus className="size-3.5" />
                        Creaza Nota
                    </Button>
                </div>
            </div>

            <NoteModal 
                isOpen={showModal} 
                onClose={handleCloseModal} 
                onSubmit={handleSubmit} 
                editingNote={editingNote} 
                error={error} 
            />

            <NoteList 
                notes={notes} 
                onEdit={handleOpenModal} 
                onDelete={deleteNote} 
                onCreateClick={() => handleOpenModal()} 
            />
        </div>
    );
}
