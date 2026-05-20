import { useState, useEffect, useRef } from "react";

const HISTORY_KEY = "change-calculator-history";
const MAX_HISTORY_ITEMS = 10;

export type CalculationKind = "ok" | "short" | "exact";

export interface CalculationEntry {
    id: string;
    cost: number;
    given: number;
    change: number;
    kind: CalculationKind;
    timestamp: number;
}

function loadFromStorage(): CalculationEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const stored = window.localStorage.getItem(HISTORY_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Failed to load calculator history:", e);
        return [];
    }
}

export function useCalculatorHistory() {
    const [items, setItems] = useState<CalculationEntry[]>(loadFromStorage);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        try {
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
        } catch (e) {
            console.error("Failed to save calculator history:", e);
        }
    }, [items]);

    const addEntry = (entry: Omit<CalculationEntry, "id" | "timestamp">) => {
        setItems(prev => {
            const next: CalculationEntry = {
                ...entry,
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                timestamp: Date.now(),
            };
            return [next, ...prev].slice(0, MAX_HISTORY_ITEMS);
        });
    };

    const removeEntry = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const clearHistory = () => setItems([]);

    return { items, addEntry, removeEntry, clearHistory };
}
