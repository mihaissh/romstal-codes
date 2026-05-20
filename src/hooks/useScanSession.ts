import { useCallback, useState } from "react";
import type { FilialaCode } from "@/types/filiala";
import type { Product } from "@/types/Product";
import type { ScannedItem } from "@/types/scanned";
import { lookupProductByCodeForStore } from "@/utils/search";

export type ScanModalState =
    | { status: "loading" }
    | { status: "found"; product: Product; storageNote?: string }
    | { status: "error"; code: string; message: string };

export function useScanSession(store: FilialaCode) {
    const [scanModal, setScanModal] = useState<ScanModalState | null>(null);
    const [scanQuantity, setScanQuantity] = useState(1);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

    const closeScanModal = useCallback(() => {
        setScanModal(null);
        setScanQuantity(1);
    }, []);

    const resetSession = useCallback(() => {
        setScanModal(null);
        setScanQuantity(1);
        setScannedItems([]);
    }, []);

    const handleScanAdd = useCallback(() => {
        if (scanModal?.status !== "found" || scanQuantity < 1) return;

        const { product } = scanModal;
        setScannedItems((prev) => {
            const existing = prev.find((item) => item.product.code === product.code);
            if (existing) {
                return prev.map((item) =>
                    item.product.code === product.code
                        ? { ...item, count: item.count + scanQuantity }
                        : item,
                );
            }
            return [{ product, count: scanQuantity }, ...prev];
        });
        closeScanModal();
    }, [scanModal, scanQuantity, closeScanModal]);

    const removeScannedItem = useCallback((code: string) => {
        setScannedItems((prev) => prev.filter((item) => item.product.code !== code));
    }, []);

    const handleScanSuccess = useCallback(
        async (code: string) => {
            if (scanModal !== null) return;

            setScanQuantity(1);
            setScanModal({ status: "loading" });

            const result = await lookupProductByCodeForStore(code, store);

            if (result) {
                setScanModal({
                    status: "found",
                    product: result.product,
                    storageNote: result.storageNote,
                });
            } else {
                setScanModal({
                    status: "error",
                    code,
                    message: `Produsul cu codul ${code} nu a fost găsit la filiala ${store}.`,
                });
            }
        },
        [scanModal, store],
    );

    return {
        scanModal,
        scanQuantity,
        setScanQuantity,
        scannedItems,
        scanPaused: scanModal !== null,
        closeScanModal,
        handleScanAdd,
        handleScanSuccess,
        removeScannedItem,
        resetSession,
    };
}
