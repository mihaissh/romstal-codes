import type { ScannedItem } from "@/components/scanner/ScannedList";

export async function exportScannedListXlsx(
    items: ScannedItem[],
    store: string,
): Promise<void> {
    if (items.length === 0) return;

    const XLSX = await import("xlsx");
    const rows: (string | number)[][] = [
        ["Cod", "Denumire", "Cantitate"],
        ...items.map(({ product, count }) => [product.code, product.name, count]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scanari");

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `scanari-${store}-${date}.xlsx`);
}
