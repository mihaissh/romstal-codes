import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type NoteTag = "platit" | "neplatit" | "livrare curier" | "livrare marfa" | "ridica client" | "SPEDEX";

export interface Note {
    id: string;
    nume: string;
    client: string;
    orderOrInvoice: string;
    phone_number?: string;
    text?: string;
    tags: NoteTag[];
    createdAt: number;
    updatedAt?: number;
    user_id?: string;
}

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Get current user on mount and when auth state changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('notes')
                .select('*')
                .order('createdAt', { ascending: false });

            // If user is logged in, only show their notes
            // Note: This assumes you added the user_id column
            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching notes:", error);
            } else if (data) {
                setNotes(data as Note[]);
            }
        } catch (e) {
            console.error("Failed to fetch notes:", e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const addNote = async (note: Omit<Note, "id" | "createdAt" | "updatedAt" | "user_id">) => {
        const newNote = {
            ...note,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            user_id: userId, // Associate with current user if logged in
        };

        try {
            const { error } = await supabase.from('notes').insert([newNote]);
            if (error) {
                console.error("Error adding note:", error);
            } else {
                setNotes([newNote as Note, ...notes]);
            }
        } catch (e) {
            console.error("Failed to add note:", e);
        }
    };

    const updateNote = async (id: string, updates: Partial<Omit<Note, "id" | "createdAt" | "user_id">>) => {
        const updatedAt = Date.now();
        try {
            const { error } = await supabase
                .from('notes')
                .update({ ...updates, updatedAt })
                .eq('id', id);

            if (error) {
                console.error("Error updating note:", error);
            } else {
                setNotes(notes.map((n) => 
                    n.id === id ? { ...n, ...updates, updatedAt } : n
                ));
            }
        } catch (e) {
            console.error("Failed to update note:", e);
        }
    };

    const deleteNote = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', id);

            if (error) {
                console.error("Error deleting note:", error);
            } else {
                setNotes(notes.filter((n) => n.id !== id));
            }
        } catch (e) {
            console.error("Failed to delete note:", e);
        }
    };

    const clearNotes = async () => {
        try {
            let query = supabase.from('notes').delete();
            
            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.neq('id', '');
            }

            const { error } = await query;

            if (error) {
                console.error("Error clearing notes:", error);
            } else {
                setNotes([]);
            }
        } catch (e) {
            console.error("Failed to clear notes:", e);
        }
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
