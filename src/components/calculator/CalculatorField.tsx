interface FieldProps {
    label: string;
    hint: string;
    value: string;
    onChange: (v: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function CalculatorField({ label, hint, value, onChange, onKeyDown, inputRef }: FieldProps) {
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
