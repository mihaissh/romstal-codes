import { describe, it, expect } from "vitest";
import { parseMetaFromName } from "./productMetadata";

describe("parseMetaFromName", () => {
    it("should correctly parse category, material, color, and dimensions from standard product name", () => {
        const name = "COT DIN PPR ALB 90 G D. 20 mm";
        const meta = parseMetaFromName(name);
        
        expect(meta.category).toBe("Coturi");
        expect(meta.productMaterial).toBe("PPR");
        expect(meta.color).toBe("Alb");
        expect(meta.dimensions.angle).toBe(90);
        expect(meta.dimensions.diameter).toBe(20);
    });

    it("should correctly parse thread sizes and angles", () => {
        const name = 'COT FE PPR ALB 90 GRD D 20 mmx3/4"';
        const meta = parseMetaFromName(name);
        
        expect(meta.category).toBe("Coturi");
        expect(meta.productMaterial).toBe("PPR");
        expect(meta.color).toBe("Alb");
        expect(meta.dimensions.angle).toBe(90);
        expect(meta.dimensions.diameter).toBe(20);
        expect(meta.dimensions.threadSize).toContain("3/4");
    });

    it("should handle names without specific attributes gracefully", () => {
        const name = "TEAVA GRI FARA ALTE SPECIFICATII";
        const meta = parseMetaFromName(name);
        
        expect(meta.category).toBe("Teava");
        expect(meta.productMaterial).toBeNull();
        expect(meta.color).toBe("Gri");
        expect(meta.dimensions.angle).toBeUndefined();
        expect(meta.dimensions.diameter).toBeUndefined();
    });
});
