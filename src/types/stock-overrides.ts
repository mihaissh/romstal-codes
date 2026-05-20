import type { FilialaCode } from "./filiala";

export type StockOverridePayload = {
    rows: Record<string, number>;
    codes: Record<string, number>;
};

export type AllStockOverrides = Partial<Record<FilialaCode, StockOverridePayload>>;
