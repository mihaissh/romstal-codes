import { describe, it, expect } from "vitest";
import { parseAmount, formatAmount } from "./calculator";

describe("calculator utils", () => {
    describe("parseAmount", () => {
        it("should parse simple numbers", () => {
            expect(parseAmount("100")).toBe(100);
            expect(parseAmount("100.5")).toBe(100.5);
        });

        it("should parse Romanian format (comma for decimal)", () => {
            expect(parseAmount("100,5")).toBe(100.5);
        });

        it("should handle thousands separator (dot)", () => {
            expect(parseAmount("1.000,5")).toBe(1000.5);
        });

        it("should handle spaces", () => {
            expect(parseAmount(" 1 000 , 5 ")).toBe(1000.5);
        });

        it("should return null for empty or invalid input", () => {
            expect(parseAmount("")).toBe(null);
            expect(parseAmount("abc")).toBe(null);
        });
    });

    describe("formatAmount", () => {
        it("should format numbers in Romanian style", () => {
            // Note: Intl.NumberFormat might use different space characters (like non-breaking space)
            // so we replace them for easier testing if needed, or just check the main parts.
            const result = formatAmount(1234.56);
            expect(result).toMatch(/1\.234,56/);
        });
    });
});
