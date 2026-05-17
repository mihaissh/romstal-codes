import type { CalculationKind } from "@/hooks/useCalculatorHistory";

export const numberFormatter = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function parseAmount(value: string): number | null {
    if (!value.trim()) return null;
    const cleaned = value.replace(/\s+/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return null;
    return n;
}

export function formatAmount(n: number): string {
    return numberFormatter.format(n);
}

export function formatLei(n: number): string {
    return `${formatAmount(n)} lei`;
}

export const DENOMINATIONS = [
    { value: 500, label: "500 lei", image: "/images/money/500 lei.jpg" },
    { value: 200, label: "200 lei", image: "/images/money/200_lei._Romania,_2006_a.jpg" },
    { value: 100, label: "100 lei", image: "/images/money/100_lei._Romania.jpg" },
    { value: 50, label: "50 lei", image: "/images/money/50_lei._Romania,_2005_a.jpg" },
    { value: 20, label: "20 lei", image: "/images/money/20_lei._Romania,_2021_a.jpg" },
    { value: 10, label: "10 lei", image: "/images/money/10_lei.jpg" },
    { value: 5, label: "5 lei", image: "/images/money/5_lei._Romania,_2005_a.jpg" },
    { value: 1, label: "1 leu", image: "/images/money/1_leu._Romania,_2005_a.jpg" },
    { value: 0.5, label: "50 bani", image: null },
    { value: 0.1, label: "10 bani", image: null },
    { value: 0.05, label: "5 bani", image: null },
    { value: 0.01, label: "1 ban", image: null },
];

export function getChangeBreakdown(amount: number) {
    const breakdown: { value: number; count: number; label: string; image: string | null }[] = [];
    let remaining = Math.round(amount * 100);

    for (const den of DENOMINATIONS) {
        const denValue = Math.round(den.value * 100);
        const count = Math.floor(remaining / denValue);
        if (count > 0) {
            breakdown.push({ ...den, count });
            remaining -= count * denValue;
        }
    }
    return breakdown;
}

export const RESULT_CONFIG: Record<CalculationKind, { label: string; cls: string; valueCls: string; prefix: string }> = {
    ok:    { label: "Rest de dat",       cls: "bg-tag-category-bg text-tag-category-text border-tag-category-text/20",     valueCls: "text-tag-category-text",  prefix: "" },
    exact: { label: "Suma exacta",       cls: "bg-tag-dimension-bg text-tag-dimension-text border-tag-dimension-text/20",  valueCls: "text-tag-dimension-text", prefix: "" },
    short: { label: "Suma insuficienta", cls: "bg-destructive/10 text-destructive border-destructive/20",                  valueCls: "text-destructive",        prefix: "Lipsesc " },
};
