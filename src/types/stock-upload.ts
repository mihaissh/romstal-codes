import type { FilialaCode } from "./filiala";

export interface ParsedStockRow {
    code: string;
    name: string;
    stock: number;
    unit: string;
    value: number;
    storage: string;
    storageDesc: string;
    store: FilialaCode;
    storeName: string;
}

export interface StockSnapshotEntry {
    code: string;
    storage: string;
    stock: number;
    name: string;
    unit: string;
    value: number;
    storename: string;
    storagedesc: string;
}

export interface StockUploadSnapshot {
    store: FilialaCode;
    createdAt: string;
    fileName: string;
    entries: StockSnapshotEntry[];
}

export type StockUploadProgress = {
    phase: "snapshot" | "upsert" | "zero" | "done";
    message: string;
    current?: number;
    total?: number;
};
