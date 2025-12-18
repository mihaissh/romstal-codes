import { useState, useEffect } from "react";
import type { Product } from "../types/Product";

const HISTORY_KEY = "product-search-history";
const MAX_HISTORY_ITEMS = 10;

export interface HistoryItem {
  product: Product;
  timestamp: number;
}

export function useSearchHistory() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistoryItems(parsed);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyItems));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }, [historyItems]);

  const addToHistory = (product: Product) => {
    setHistoryItems((prev) => {
      const filtered = prev.filter((item) => item.product.Material !== product.Material);
      const newItem: HistoryItem = {
        product,
        timestamp: Date.now()
      };
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (materialCode: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.product.Material !== materialCode));
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
