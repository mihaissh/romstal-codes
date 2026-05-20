import type { FilialaCode } from "@/types/filiala";
import type { ParsedStockRow } from "@/types/stock-upload";
import type { StockOverridePayload } from "@/types/stock-overrides";
import { normalizeCode, normalizeStorage, overrideEntryCount } from "@/utils/stockOverridesLogic";

const COD_KEYS = new Set([
    "cod",
    "code",
    "codprodus",
    "codprod",
    "codarticol",
    "articole",
    "material",
]);

const STORAGE_KEYS = new Set([
    "magazie",
    "deposit",
    "depozit",
    "codmagazie",
    "storage",
    "locatie",
    "locdedepozitare",
    "locdepozitare",
]);

const STOC_KEYS = new Set([
    "stoc",
    "cantitate",
    "qty",
    "disponibil",
    "stocdisponibil",
    "sold",
    "cant",
    "fararestr",
]);

export interface ParsedSheetLayout {
    headerIdx: number;
    codeIx: number;
    qtyIx: number;
    storIx: number;
    nameIx: number;
    storageDescIx: number;
    unitIx: number;
    valueIx: number;
    storeIx: number;
    storeNameIx: number;
}

function cellKey(cell: unknown): string {
    return String(cell ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "");
}

function scoreHeaderColumn(norm: string, role: "code" | "storage" | "qty"): number {
    if (role === "code") {
        if (norm === "material") return 100;
        if (norm === "cod" || norm === "code") return 95;
        if (COD_KEYS.has(norm) && !norm.includes("descriere")) return 80;
        if (norm.includes("material") && !norm.includes("descriere")) return 50;
        return 0;
    }
    if (role === "storage") {
        if (norm === "locdedepozitare") return 100;
        if (STORAGE_KEYS.has(norm) && !norm.includes("descr")) return 85;
        if (norm.includes("loc") && norm.includes("depoz") && !norm.includes("descr")) return 70;
        return 0;
    }
    if (role === "qty") {
        if (norm === "fararestr") return 100;
        if (norm === "stoc" || norm === "cantitate") return 95;
        if (STOC_KEYS.has(norm) && !norm.startsWith("val")) return 80;
        if (
            (norm.includes("restr") || norm.includes("nerestric")) &&
            !norm.startsWith("val")
        ) {
            return 60;
        }
        if (norm.includes("stoc") && !norm.includes("descriere") && !norm.startsWith("val")) {
            return 50;
        }
        return 0;
    }
    return 0;
}

function pickColumnIndices(line: unknown[]): {
    code: number;
    storage: number;
    qty: number;
} | null {
    const bestScore = { code: 0, storage: 0, qty: 0 };
    const idx = { code: -1, storage: -1, qty: -1 };

    for (let c = 0; c < line.length; c++) {
        const norm = cellKey(line[c]);
        for (const role of ["code", "storage", "qty"] as const) {
            const s = scoreHeaderColumn(norm, role);
            if (s > bestScore[role]) {
                bestScore[role] = s;
                idx[role] = c;
            }
        }
    }

    if (bestScore.code > 0 && bestScore.qty > 0 && idx.code !== idx.qty) {
        return {
            code: idx.code,
            storage: bestScore.storage > 0 ? idx.storage : -1,
            qty: idx.qty,
        };
    }
    return null;
}

function pickExportExtras(headerLine: unknown[]): Omit<ParsedSheetLayout, "headerIdx" | "codeIx" | "qtyIx" | "storIx"> {
    const h = headerLine.map((c) => cellKey(c));
    const find = (...predicates: ((k: string) => boolean)[]) => {
        for (const pred of predicates) {
            const ix = h.findIndex(pred);
            if (ix >= 0) return ix;
        }
        return -1;
    };
    return {
        nameIx: find((k) => k === "descrierematerial", (k) => k.includes("descriere") && k.includes("material")),
        storageDescIx: find((k) => k.startsWith("descrloc") && k.includes("depoz")),
        unitIx: find((k) => k === "unitatedebaza", (k) => k.includes("unitate") && k.includes("baza")),
        valueIx: find((k) => k === "valnerestrict", (k) => k.startsWith("val") && k.includes("restric")),
        storeIx: find((k) => k === "unitatelogistica", (k) => k.includes("unitate") && k.includes("logist")),
        storeNameIx: find((k) => k === "name1"),
    };
}

function parseQty(raw: unknown): number | null {
    if (raw === undefined || raw === null || raw === "") return null;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const s = String(raw).trim().replace(/\s+/g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

function parseValue(raw: unknown): number {
    const q = parseQty(raw);
    return q ?? 0;
}

function strCell(raw: unknown): string {
    return String(raw ?? "").trim();
}

async function readWorkbookRows(blob: Blob): Promise<unknown[][]> {
    const XLSX = await import("xlsx");
    const buffer = await blob.arrayBuffer();

    let workbook;
    try {
        workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    } catch {
        throw new Error("Nu am putut citi fisierul. Foloseste .xlsx, .xls sau .csv.");
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Fisierul nu contine foi de calcul.");

    const sheet = workbook.Sheets[sheetName];
    const rowsUnknown = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as unknown[][];
    return rowsUnknown.filter((r) => Array.isArray(r));
}

export function detectSheetLayout(rows: unknown[][]): ParsedSheetLayout {
    let headerIdx = -1;
    let codeIx = -1;
    let qtyIx = -1;
    let storIx = -1;

    for (let r = 0; r < Math.min(rows.length, 40); r++) {
        const picked = pickColumnIndices(rows[r] as unknown[]);
        if (picked) {
            headerIdx = r;
            codeIx = picked.code;
            qtyIx = picked.qty;
            storIx = picked.storage;
            const extras = pickExportExtras(rows[r] as unknown[]);
            return { headerIdx, codeIx, qtyIx, storIx, ...extras };
        }
    }

    throw new Error(
        'Antet nerecunoscut. Aștept coloane tip EXPORT: "Material", "Fără restr." și opțional "Loc de depozitare" — sau "Cod", "Stoc"/"Cantitate".',
    );
}

function rowKey(code: string, storage: string): string {
    return `${normalizeCode(code)}|${normalizeStorage(storage)}`;
}

export async function parseStockSpreadsheetRows(
    blob: Blob,
    fallbackStore: FilialaCode,
): Promise<ParsedStockRow[]> {
    const rows = await readWorkbookRows(blob);
    const layout = detectSheetLayout(rows);
    const { headerIdx, codeIx, qtyIx, storIx } = layout;

    const byKey = new Map<string, ParsedStockRow>();

    for (let r = headerIdx + 1; r < rows.length; r++) {
        const line = rows[r] as unknown[];
        if (!line.length) continue;

        const code = strCell(line[codeIx]);
        const qty = parseQty(line[qtyIx]);
        if (!code || qty === null) continue;

        const storage =
            storIx >= 0 && strCell(line[storIx]) !== ""
                ? normalizeStorage(line[storIx])
                : "1V00";

        const fileStore = strCell(
            layout.storeIx >= 0 ? line[layout.storeIx] : "",
        ).toUpperCase() as FilialaCode;
        const store: FilialaCode =
            fileStore === "1BN1" || fileStore === "1BV1" ? fileStore : fallbackStore;

        const name =
            layout.nameIx >= 0 ? strCell(line[layout.nameIx]) : `Produs ${code}`;
        const storageDesc =
            layout.storageDescIx >= 0 ? strCell(line[layout.storageDescIx]) : "Vanzare Marfa";
        const unit = layout.unitIx >= 0 ? strCell(line[layout.unitIx]) || "buc" : "buc";
        const value = layout.valueIx >= 0 ? parseValue(line[layout.valueIx]) : 0;
        const storeName =
            layout.storeNameIx >= 0 ? strCell(line[layout.storeNameIx]) : store;

        byKey.set(rowKey(code, storage), {
            code,
            name,
            stock: qty,
            unit,
            value,
            storage,
            storageDesc,
            store,
            storeName,
        });
    }

    const list = [...byKey.values()];
    if (list.length === 0) {
        throw new Error("Nu exista randuri valide dupa antet.");
    }
    return list;
}

export async function parseStockSpreadsheet(blob: Blob): Promise<StockOverridePayload> {
    const rows = await readWorkbookRows(blob);
    const layout = detectSheetLayout(rows);
    const { headerIdx, codeIx, qtyIx, storIx } = layout;

    const out: StockOverridePayload = { rows: {}, codes: {} };

    for (let r = headerIdx + 1; r < rows.length; r++) {
        const line = rows[r] as unknown[];
        if (!line.length) continue;

        const codeNorm = normalizeCode(line[codeIx]);
        const qty = parseQty(line[qtyIx]);
        if (!codeNorm || qty === null) continue;

        if (storIx >= 0 && line[storIx] !== undefined && String(line[storIx]).trim() !== "") {
            const stor = normalizeStorage(line[storIx]);
            out.rows[`${codeNorm}|${stor}`] = qty;
        } else {
            out.codes[codeNorm] = qty;
        }
    }

    if (overrideEntryCount(out) === 0) {
        throw new Error("Nu exista randuri valide dupa antet.");
    }

    return out;
}
