import type { Product } from "@/types/Product";
import type { StockOverridePayload } from "@/types/stock-overrides";

export function normalizeCode(raw: unknown): string {
    return String(raw ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
}

export function normalizeStorage(raw: unknown): string {
    return String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function compositeKey(product: Pick<Product, "code" | "storage">): string {
    return `${normalizeCode(product.code)}|${normalizeStorage(product.storage)}`;
}

export function effectiveStock(product: Product, overrides?: StockOverridePayload): number {
    if (!overrides) return product.stock;

    const byRow = overrides.rows?.[compositeKey(product)];
    if (typeof byRow === "number" && Number.isFinite(byRow)) return byRow;

    const byCode = overrides.codes?.[normalizeCode(product.code)];
    if (typeof byCode === "number" && Number.isFinite(byCode)) return byCode;

    return product.stock;
}

export function overrideEntryCount(payload?: StockOverridePayload): number {
    if (!payload) return 0;
    const r = payload.rows ? Object.keys(payload.rows).length : 0;
    const c = payload.codes ? Object.keys(payload.codes).length : 0;
    return r + c;
}
