import type { Product } from "@/types/Product";

export function productFromDbRow(p: Record<string, unknown>): Product {
    return {
        ...(p as unknown as Product),
        productMaterial: p.productmaterial as string | null,
        storeName: p.storename as string,
        storageDesc: (p.storagedesc ?? "") as string,
    };
}
