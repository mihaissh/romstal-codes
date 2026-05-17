import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useCalculatorHistory, type CalculationEntry, type CalculationKind } from "@/hooks/useCalculatorHistory";
import { parseAmount, formatAmount } from "@/utils/calculator";
import CalculatorField from "./calculator/CalculatorField";
import ResultPanel from "./calculator/ResultPanel";
import CalculationHistory from "./calculator/CalculationHistory";

interface Result { 
    kind: CalculationKind; 
    amount: number; 
    cost: number; 
    given: number; 
}

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
                    <CalculatorField
                        inputRef={costRef}
                        label="Cost total"
                        hint="Suma de plata"
                        value={cost}
                        onChange={setCost}
                        onKeyDown={handleKeyDown}
                    />
                    <CalculatorField
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
