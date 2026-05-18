import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseStockSpreadsheet, parseStockSpreadsheetRows } from "./parseStockXlsx";

/** Romstal EXPORT header row (same as desktop export) */
const EXPORT_HEADERS = [
    "Unitate logistică",
    "Name 1",
    "Material",
    "Descriere material",
    "Loc de depozitare",
    "Descr.loc.depozitare",
    "Fără restr.",
    "Unitate de bază",
    "Val. nerestricţ.",
];

function buildExportBlob(rows: unknown[][]): Blob {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
}

describe("parseStockSpreadsheet", () => {
    it("parses Romstal EXPORT layout (Material, Loc de depozitare, Fără restr.)", async () => {
        const blob = buildExportBlob([
            EXPORT_HEADERS,
            ["1BN1", "ROMSTAL BRAN", "40010407", "ROBINET …", "1V00", "Vanzare Marfa", 9, "buc", 117.31],
            ["1BN1", "ROMSTAL BRAN", "40015409", "ROBINET …", "1V00", "Vanzare Marfa", 7, "buc", 154.01],
        ]);

        const result = await parseStockSpreadsheet(blob);

        expect(result.rows["40010407|1V00"]).toBe(9);
        expect(result.rows["40015409|1V00"]).toBe(7);
    });

    it("parses EXPORT rows for Supabase upload", async () => {
        const blob = buildExportBlob([
            EXPORT_HEADERS,
            ["1BN1", "ROMSTAL BRAN", "40010407", "ROBINET …", "1V00", "Vanzare Marfa", 9, "buc", 117.31],
        ]);

        const rows = await parseStockSpreadsheetRows(blob, "1BN1");
        expect(rows).toHaveLength(1);
        expect(rows[0].code).toBe("40010407");
        expect(rows[0].stock).toBe(9);
        expect(rows[0].storage).toBe("1V00");
        expect(rows[0].store).toBe("1BN1");
    });

    it("parses simple Cod + Stoc headers", async () => {
        const blob = buildExportBlob([
            ["Cod", "Stoc"],
            ["12345", 12],
        ]);

        const result = await parseStockSpreadsheet(blob);
        expect(result.codes["12345"]).toBe(12);
    });
});
