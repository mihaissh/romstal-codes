import type { FilialaCode } from "./filiala";

export type StockOverridePayload = {
    /** Full row key `${codeNormalized}|${storageUpper}` → quantity */
    rows: Record<string, number>;
    /** Code-only overrides (applied when no row-specific match) */
    codes: Record<string, number>;
};

export type AllStockOverrides = Partial<Record<FilialaCode, StockOverridePayload>>;
