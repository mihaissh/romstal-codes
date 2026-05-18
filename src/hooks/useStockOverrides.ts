import { useCallback, useEffect, useMemo, useState } from "react";
import type { FilialaCode } from "@/types/filiala";
import type { AllStockOverrides, StockOverridePayload } from "@/types/stock-overrides";

const LS_KEY = "romstal-stock-overrides-v2";

function safeLoad(): AllStockOverrides {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as AllStockOverrides;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function normalizePayload(p: Partial<StockOverridePayload> | undefined): StockOverridePayload {
    const rows =
        p?.rows && typeof p.rows === "object" ? { ...p.rows } : {};
    const codes =
        p?.codes && typeof p.codes === "object" ? { ...p.codes } : {};
    return { rows, codes };
}

export function useStockOverrides(store: FilialaCode) {
    const [all, setAll] = useState<AllStockOverrides>(safeLoad);

    useEffect(() => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(all));
        } catch {
            /* quota */
        }
    }, [all]);

    const overrides = useMemo(() => normalizePayload(all[store]), [all, store]);

    const mergeUploaded = useCallback(
        (payload: StockOverridePayload, mode: "merge" | "replace" = "merge") => {
            setAll((prev) => {
                const prevSl = normalizePayload(prev[store]);
                const merged: StockOverridePayload =
                    mode === "replace"
                        ? normalizePayload(payload)
                        : {
                              rows: { ...prevSl.rows, ...payload.rows },
                              codes: { ...prevSl.codes, ...payload.codes },
                          };
                return { ...prev, [store]: merged };
            });
        },
        [store],
    );

    const clearStoreOverrides = useCallback(() => {
        setAll((prev) => {
            if (!(store in prev)) return prev;
            const next = { ...prev };
            delete next[store];
            return next;
        });
    }, [store]);

    return { overrides, mergeUploaded, clearStoreOverrides };
}
