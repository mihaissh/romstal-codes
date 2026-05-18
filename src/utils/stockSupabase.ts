import type { FilialaCode } from "@/types/filiala";
import type {
    ParsedStockRow,
    StockSnapshotEntry,
    StockUploadProgress,
    StockUploadSnapshot,
} from "@/types/stock-upload";
import { supabase } from "@/lib/supabase";
import { buildProductTokens } from "@/utils/productTokens";
import { normalizeCode, normalizeStorage } from "@/utils/stockOverridesLogic";

const BATCH = 400;
const PAGE = 1000;

function rowKey(code: string, storage: string): string {
    return `${normalizeCode(code)}|${normalizeStorage(storage)}`;
}

type DbProductRow = {
    code: string;
    storage: string;
    stock: number;
    name: string;
    unit: string;
    value: number;
    storename: string;
    storagedesc: string;
};

export async function fetchStoreStockSnapshot(
    store: FilialaCode,
    onProgress?: (p: StockUploadProgress) => void,
): Promise<StockSnapshotEntry[]> {
    const entries: StockSnapshotEntry[] = [];
    let from = 0;

    onProgress?.({ phase: "snapshot", message: "Salvez starea curenta din baza de date…" });

    while (true) {
        const { data, error } = await supabase
            .from("products")
            .select("code, storage, stock, name, unit, value, storename, storagedesc")
            .eq("store", store)
            .range(from, from + PAGE - 1);

        if (error) {
            throw new Error(`Nu pot citi stocul existent: ${error.message}`);
        }

        const chunk = (data ?? []) as DbProductRow[];
        for (const row of chunk) {
            entries.push({
                code: row.code,
                storage: row.storage,
                stock: row.stock,
                name: row.name,
                unit: row.unit,
                value: row.value,
                storename: row.storename,
                storagedesc: row.storagedesc,
            });
        }

        onProgress?.({
            phase: "snapshot",
            message: "Salvez starea curenta…",
            current: entries.length,
        });

        if (chunk.length < PAGE) break;
        from += PAGE;
    }

    return entries;
}

function parsedRowToUpsert(row: ParsedStockRow) {
    return {
        code: row.code,
        name: row.name,
        category: "Altele",
        productmaterial: null,
        color: null,
        dimensions: null,
        stock: row.stock,
        unit: row.unit,
        value: row.value,
        store: row.store,
        storename: row.storeName,
        storage: row.storage,
        storagedesc: row.storageDesc,
        tokens: buildProductTokens(row.name, row.code),
    };
}

function snapshotEntryToUpsert(entry: StockSnapshotEntry, store: FilialaCode, stock: number) {
    return {
        code: entry.code,
        name: entry.name,
        category: "Altele",
        productmaterial: null,
        color: null,
        dimensions: null,
        stock,
        unit: entry.unit,
        value: entry.value,
        store,
        storename: entry.storename,
        storage: entry.storage,
        storagedesc: entry.storagedesc,
        tokens: buildProductTokens(entry.name, entry.code),
    };
}

export async function replaceStoreStockFromFile(
    store: FilialaCode,
    fileRows: ParsedStockRow[],
    options: {
        fileName?: string;
        onProgress?: (p: StockUploadProgress) => void;
    } = {},
): Promise<{
    snapshot: StockUploadSnapshot;
    upserted: number;
    zeroed: number;
}> {
    const { onProgress, fileName = "" } = options;

    const rows = fileRows.filter((r) => r.store === store);
    const wrongStore = fileRows.filter((r) => r.store !== store);
    if (rows.length === 0) {
        throw new Error(
            `Fisierul nu contine randuri pentru filiala ${store}. Verifica coloana „Unitate logistica”.`,
        );
    }
    if (wrongStore.length > 0 && rows.length < fileRows.length * 0.5) {
        throw new Error(
            `Majoritatea randurilor sunt pentru alta filiala decat ${store}. Selecteaza filiala corecta.`,
        );
    }

    const fileKeys = new Set(rows.map((r) => rowKey(r.code, r.storage)));

    const entries = await fetchStoreStockSnapshot(store, onProgress);
    const snapshot: StockUploadSnapshot = {
        store,
        createdAt: new Date().toISOString(),
        fileName,
        entries,
    };

    let upserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH).map(parsedRowToUpsert);
        const { error } = await supabase
            .from("products")
            .upsert(batch, { onConflict: "code,store,storage" });

        if (error) {
            throw new Error(`Eroare la scrierea stocului: ${error.message}`);
        }
        upserted += batch.length;
        onProgress?.({
            phase: "upsert",
            message: "Actualizez produse din fisier…",
            current: upserted,
            total: rows.length,
        });
    }

    const toZero: StockSnapshotEntry[] = [];
    for (const e of entries) {
        if (!fileKeys.has(rowKey(e.code, e.storage))) {
            toZero.push(e);
        }
    }

    let zeroed = 0;
    for (let i = 0; i < toZero.length; i += BATCH) {
        const batch = toZero
            .slice(i, i + BATCH)
            .map((z) => snapshotEntryToUpsert(z, store, 0));
        const { error } = await supabase
            .from("products")
            .upsert(batch, { onConflict: "code,store,storage" });

        if (error) {
            throw new Error(`Eroare la golirea stocului vechi: ${error.message}`);
        }
        zeroed += batch.length;
        onProgress?.({
            phase: "zero",
            message: "Pun stoc 0 la produsele care nu mai sunt in fisier…",
            current: zeroed,
            total: toZero.length,
        });
    }

    onProgress?.({ phase: "done", message: "Finalizat." });

    return { snapshot, upserted, zeroed };
}

export async function restoreStockSnapshot(
    snapshot: StockUploadSnapshot,
    onProgress?: (p: StockUploadProgress) => void,
): Promise<number> {
    const { store, entries } = snapshot;
    let restored = 0;

    onProgress?.({
        phase: "upsert",
        message: "Restaurez stocul anterior…",
        current: 0,
        total: entries.length,
    });

    for (let i = 0; i < entries.length; i += BATCH) {
        const batch = entries
            .slice(i, i + BATCH)
            .map((e) => snapshotEntryToUpsert(e, store, e.stock));

        const { error } = await supabase
            .from("products")
            .upsert(batch, { onConflict: "code,store,storage" });

        if (error) {
            throw new Error(`Eroare la restaurare: ${error.message}`);
        }

        restored += batch.length;
        onProgress?.({
            phase: "upsert",
            message: "Restaurez stocul anterior…",
            current: restored,
            total: entries.length,
        });
    }

    onProgress?.({ phase: "done", message: "Restaurare finalizata." });
    return restored;
}
