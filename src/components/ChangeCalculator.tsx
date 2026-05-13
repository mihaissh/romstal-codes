import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, History } from "lucide-react";
import { useCalculatorHistory, type CalculationEntry, type CalculationKind } from "@/hooks/useCalculatorHistory";

function parseAmount(value: string): number | null {
    if (!value.trim()) return null;
    // Romanian: "." is thousands separator, "," is decimal separator.
    // Strip thousand dots, then convert decimal comma to dot.
    const cleaned = value.replace(/\s+/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return null;
    return n;
}

const numberFormatter = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatAmount(n: number): string {
    return numberFormatter.format(n);
}

function formatLei(n: number): string {
    return `${formatAmount(n)} lei`;
}

interface Result { kind: CalculationKind; amount: number; cost: number; given: number; }

export default function ChangeCalculator() {
    const [cost, setCost] = useState("");
    const [given, setGiven] = useState("");
    const [result, setResult] = useState<Result | null>(null);
    const costRef = useRef<HTMLInputElement>(null);
    const { items, addEntry, removeEntry, clearHistory } = useCalculatorHistory();

    useEffect(() => { costRef.current?.focus(); }, []);
    useEffect(() => { setResult(null); }, [cost, given]);

    const parsedCost = useMemo(() => parseAmount(cost), [cost]);
    const parsedGiven = useMemo(() => parseAmount(given), [given]);
    const canCalculate =
        parsedCost !== null && parsedGiven !== null &&
        parsedCost >= 0 && parsedGiven >= 0;

    const handleCalculate = () => {
        if (!canCalculate) return;
        const c = parsedCost as number;
        const g = parsedGiven as number;
        const diff = Math.round((g - c) * 100) / 100;
        const kind: CalculationKind = diff < 0 ? "short" : diff === 0 ? "exact" : "ok";
        const amount = Math.abs(diff);
        setResult({ kind, amount, cost: c, given: g });
        addEntry({ cost: c, given: g, change: diff, kind });
    };

    const handleReset = () => {
        setCost("");
        setGiven("");
        setResult(null);
        costRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { e.preventDefault(); handleCalculate(); }
    };

    const handleReuse = (entry: CalculationEntry) => {
        setCost(formatAmount(entry.cost));
        setGiven(formatAmount(entry.given));
        setResult({
            kind: entry.kind,
            amount: Math.abs(entry.change),
            cost: entry.cost,
            given: entry.given,
        });
    };

    return (
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="rounded-2xl border border-border bg-card/60 dark:bg-card/40 dark:backdrop-blur-sm shadow-sm p-5 sm:p-6">
                <div className="space-y-4">
                    <Field
                        inputRef={costRef}
                        label="Cost total"
                        hint="Suma de plata"
                        value={cost}
                        onChange={setCost}
                        onKeyDown={handleKeyDown}
                    />
                    <Field
                        label="Bani primiti"
                        hint="Suma data de client"
                        value={given}
                        onChange={setGiven}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="flex items-center gap-2 mt-6">
                    <Button
                        variant="default"
                        size="lg"
                        onClick={handleCalculate}
                        disabled={!canCalculate}
                        className="flex-1 h-11 font-semibold tracking-wide"
                    >
                        Calculeaza rest
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleReset}
                        className="h-11 px-3"
                        aria-label="Reseteaza"
                    >
                        <RotateCcw className="size-4" />
                    </Button>
                </div>

                {result && <ResultPanel result={result} />}
            </div>

            <CalculationHistory items={items} onReuse={handleReuse} onRemove={removeEntry} onClear={clearHistory} />

            <p className="mt-4 text-[11px] font-mono text-muted-foreground/60 text-center tracking-wider">
                toate sumele sunt in lei (RON)
            </p>
        </div>
    );
}

interface FieldProps {
    label: string;
    hint: string;
    value: string;
    onChange: (v: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputRef?: React.RefObject<HTMLInputElement | null>;
}

function Field({ label, hint, value, onChange, onKeyDown, inputRef }: FieldProps) {
    return (
        <label className="block">
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider uppercase">{hint}</span>
            </div>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="0,00"
                    className="w-full h-12 rounded-lg border border-input bg-card pl-4 pr-12 text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 placeholder:font-normal tabular-nums transition-all focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/10 focus-visible:shadow-lg focus-visible:shadow-primary/5 dark:bg-card/80 dark:backdrop-blur-sm"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground/50 tracking-wider pointer-events-none">
                    lei
                </span>
            </div>
        </label>
    );
}

const RESULT_CONFIG: Record<CalculationKind, { label: string; cls: string; valueCls: string; prefix: string }> = {
    ok:    { label: "Rest de dat",       cls: "bg-tag-category-bg text-tag-category-text border-tag-category-text/20",     valueCls: "text-tag-category-text",  prefix: "" },
    exact: { label: "Suma exacta",       cls: "bg-tag-dimension-bg text-tag-dimension-text border-tag-dimension-text/20",  valueCls: "text-tag-dimension-text", prefix: "" },
    short: { label: "Suma insuficienta", cls: "bg-destructive/10 text-destructive border-destructive/20",                  valueCls: "text-destructive",        prefix: "Lipsesc " },
};

function ResultPanel({ result }: { result: Result }) {
    const c = RESULT_CONFIG[result.kind];
    return (
        <div className={`mt-5 rounded-xl border ${c.cls} px-4 py-4 animate-scale-in`}>
            <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase opacity-70">
                    {c.label}
                </div>
                <div className="text-[10px] font-mono tabular-nums opacity-60">
                    {formatAmount(result.given)} − {formatAmount(result.cost)}
                </div>
            </div>
            <div className={`mt-1 text-3xl sm:text-4xl font-bold tabular-nums ${c.valueCls}`}>
                {c.prefix}{formatAmount(result.amount)} <span className="text-base font-mono font-semibold opacity-70">lei</span>
            </div>
        </div>
    );
}

interface HistoryProps {
    items: CalculationEntry[];
    onReuse: (entry: CalculationEntry) => void;
    onRemove: (id: string) => void;
    onClear: () => void;
}

function CalculationHistory({ items, onReuse, onRemove, onClear }: HistoryProps) {
    if (items.length === 0) return null;

    return (
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <History className="size-3.5 text-muted-foreground/70" />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase tracking-[0.15em]">
                        Istoric ({items.length})
                    </span>
                </div>
                <button
                    onClick={onClear}
                    className="text-[10px] font-mono text-muted-foreground/60 hover:text-destructive tracking-wider uppercase transition-colors"
                >
                    Sterge tot
                </button>
            </div>

            <div className="rounded-xl border border-border bg-card/40 dark:bg-card/30 dark:backdrop-blur-sm overflow-hidden divide-y divide-border">
                {items.map((entry, i) => (
                    <HistoryRow
                        key={entry.id}
                        entry={entry}
                        index={i}
                        onReuse={() => onReuse(entry)}
                        onRemove={() => onRemove(entry.id)}
                    />
                ))}
            </div>
        </div>
    );
}

interface HistoryRowProps {
    entry: CalculationEntry;
    index: number;
    onReuse: () => void;
    onRemove: () => void;
}

function HistoryRow({ entry, index, onReuse, onRemove }: HistoryRowProps) {
    const c = RESULT_CONFIG[entry.kind];
    const displayAmount = Math.abs(entry.change);
    return (
        <div
            onClick={onReuse}
            style={{ animationDelay: `${index * 25}ms` }}
            className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors animate-entry"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${c.cls}`}>
                        {c.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
                        {new Date(entry.timestamp).toLocaleString("ro-RO", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-muted-foreground/70 tabular-nums truncate">
                    {formatAmount(entry.given)} − {formatAmount(entry.cost)} =
                </div>
            </div>
            <div className={`flex-shrink-0 text-sm font-bold tabular-nums ${c.valueCls}`}>
                {c.prefix}{formatLei(displayAmount)}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="flex-shrink-0 p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Sterge"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}
