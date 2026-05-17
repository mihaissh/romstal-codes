import { useMemo } from "react";
import { formatAmount, getChangeBreakdown, RESULT_CONFIG } from "@/utils/calculator";
import type { CalculationKind } from "@/hooks/useCalculatorHistory";

interface Result { 
    kind: CalculationKind; 
    amount: number; 
    cost: number; 
    given: number; 
}

export default function ResultPanel({ result }: { result: Result }) {
    const c = RESULT_CONFIG[result.kind];
    const breakdown = useMemo(() => 
        result.kind === "ok" ? getChangeBreakdown(result.amount) : [], 
    [result]);

    return (
        <div className="space-y-4 animate-scale-in">
            <div className={`mt-5 rounded-xl border ${c.cls} px-4 py-4`}>
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

            {breakdown.length > 0 && (
                <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                        Bancnote si monede:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {breakdown.map((item, i) => (
                            <div 
                                key={item.value} 
                                className="bg-card/40 border border-border rounded-xl p-2 flex flex-col items-center text-center animate-fade-up"
                                style={{ animationDelay: `${(i + 1) * 50}ms` }}
                            >
                                <div className="relative w-full aspect-[2/1] mb-1.5 flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden shadow-sm group">
                                    {item.image ? (
                                        <img 
                                            src={item.image} 
                                            alt={item.label} 
                                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="text-[10px] font-mono text-muted-foreground/40 uppercase">
                                            {item.label}
                                        </div>
                                    )}
                                    <div className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg shadow-sm">
                                        x{item.count}
                                    </div>
                                </div>
                                <div className="text-[9px] font-mono font-bold uppercase tracking-tighter text-muted-foreground truncate w-full">
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
