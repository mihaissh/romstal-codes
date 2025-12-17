import { useState, useEffect } from "react";
import type { Product } from "../types/Product";

const HISTORY_KEY = "product-search-history";
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<Product[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }, [history]);

  const addToHistory = (product: Product) => {
    setHistory((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.Material !== product.Material);
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      return [product, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (materialCode: string) => {
    setHistory((prev) => prev.filter((p) => p.Material !== materialCode));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
