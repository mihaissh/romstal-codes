import { useCallback, useEffect, useState } from "react";
import type { FilialaCode } from "@/types/filiala";
import type { StockUploadSnapshot } from "@/types/stock-upload";

const LS_KEY = "romstal-stock-undo-v1";

type UndoStore = Partial<Record<FilialaCode, StockUploadSnapshot>>;

function safeLoad(): UndoStore {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as UndoStore;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export function useStockUndo(store: FilialaCode) {
    const [all, setAll] = useState<UndoStore>(safeLoad);

    useEffect(() => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(all));
        } catch {
            /* quota */
        }
    }, [all]);

    const snapshot = all[store] ?? null;

    const saveSnapshot = useCallback(
        (snap: StockUploadSnapshot): boolean => {
            try {
                const next: UndoStore = { ...safeLoad(), [store]: snap };
                const raw = JSON.stringify(next);
                if (raw.length > 4_500_000) {
                    return false;
                }
                localStorage.setItem(LS_KEY, raw);
                setAll(next);
                return true;
            } catch {
                return false;
            }
        },
        [store],
    );

    const clearSnapshot = useCallback(() => {
        setAll((prev) => {
            if (!(store in prev)) return prev;
            const next = { ...prev };
            delete next[store];
            return next;
        });
    }, [store]);

    return { snapshot, saveSnapshot, clearSnapshot };
}
