export interface ProductDimensions {
    diameter?: number;
    angle?: number;
    threadSize?: string[];
}

export interface Product {
    code: string;
    name: string;
    category: string;
    productMaterial: string | null;
    color: string | null;
    dimensions: ProductDimensions | null;
    stock: number;
    unit: string;
    value: number;
    store: string;
    storeName: string;
    storage: string;
    storageDesc: string;
    tokens: string[];
}
