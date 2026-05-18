import { useState, useEffect, useCallback } from "react";

export type NoteTag = "platit" | "neplatit" | "livrare curier" | "livrare marfa" | "ridica client" | "SPEDEX" | "emisa" | "ne emisa";

export type DocumentType = "Factura" | "Nota Livrare" | "Proforma" | "Oferta" | "Altele";

export interface Note {
    id: string;
    nume: string;
    client: string;
    orderOrInvoice: string;
    documentType?: DocumentType;
    phone_number?: string;
    text?: string;
    tags: NoteTag[];
    createdAt: number;
    updatedAt?: number;
}

const LOCAL_STORAGE_KEY = "romstal_notes_v1";

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotes = useCallback(() => {
        setLoading(true);
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setNotes(parsed.sort((a: Note, b: Note) => b.createdAt - a.createdAt));
            } else {
                setNotes([]);
            }
        } catch (e) {
            console.error("Failed to parse notes from local storage:", e);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const saveToStorage = (newNotes: Note[]) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newNotes));
    };

    const addNote = async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
        const newNote: Note = {
            ...note,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
        };

        const newNotes = [newNote, ...notes];
        setNotes(newNotes);
        saveToStorage(newNotes);
    };

    const updateNote = async (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => {
        const updatedAt = Date.now();
        const newNotes = notes.map((n) => 
            n.id === id ? { ...n, ...updates, updatedAt } : n
        );
        
        setNotes(newNotes);
        saveToStorage(newNotes);
    };

    const deleteNote = async (id: string) => {
        const newNotes = notes.filter((n) => n.id !== id);
        setNotes(newNotes);
        saveToStorage(newNotes);
    };

    const clearNotes = async () => {
        setNotes([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    };

    return {
        notes,
        loading,
        addNote,
        updateNote,
        deleteNote,
        clearNotes,
        refreshNotes: fetchNotes,
    };
}
