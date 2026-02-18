import { useState, useEffect } from "react";
import type { Product } from "../types/Product";

const HISTORY_KEY_PREFIX = "product-search-history-";
const MAX_HISTORY_ITEMS = 10;

export interface HistoryItem {
  product: Product;
  timestamp: number;
}

export function useSearchHistory(storeCode: string) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const historyKey = `${HISTORY_KEY_PREFIX}${storeCode}`;

  // Load history from localStorage on mount or when store changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(historyKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistoryItems(parsed);
      } else {
        setHistoryItems([]);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
      setHistoryItems([]);
    }
  }, [storeCode, historyKey]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(historyItems));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }, [historyItems, historyKey]);

  const addToHistory = (product: Product) => {
    setHistoryItems((prev) => {
      const filtered = prev.filter((item) => item.product.code !== product.code);
      const newItem: HistoryItem = {
        product,
        timestamp: Date.now()
      };
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (productCode: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.product.code !== productCode));
  };

  const clearHistory = () => {
    setHistoryItems([]);
  };

  return {
    history: historyItems.map(item => item.product),
    historyItems,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
