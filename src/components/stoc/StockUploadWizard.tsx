import { useState, useRef, useMemo } from "react";
import type { FilialaCode } from "@/types/filiala";
import type { ParsedStockRow, StockUploadProgress } from "@/types/stock-upload";
import { parseStockSpreadsheetRows } from "@/utils/parseStockXlsx";
import { executeStockUpload } from "@/utils/stockSupabase";
import { useStockUndo } from "@/hooks/useStockUndo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Check,
    Database,
    AlertTriangle,
    X,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StockUploadWizardProps {
    currentStore: FilialaCode;
    onClose: () => void;
}

type Step = "select" | "config" | "progress" | "result";

export default function StockUploadWizard({ currentStore, onClose }: StockUploadWizardProps) {
    const [step, setStep] = useState<Step>("select");
    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedStockRow[]>([]);
    const [parsingError, setParsingError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    // Config options
    const [targetStores, setTargetStores] = useState<FilialaCode[]>([currentStore]);
    const [importMode, setImportMode] = useState<"complete" | "partial">("complete");

    // Progress & Results
    const [uploadProgress, setUploadProgress] = useState<StockUploadProgress | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadResults, setUploadResults] = useState<{
        store: FilialaCode;
        upserted: number;
        zeroed: number;
        backupSaved: boolean;
    }[]>([]);

    // Undo management (initialized per target store, we save snapshots dynamically in upload function)
    const undo1BN1 = useStockUndo("1BN1");
    const undo1BV1 = useStockUndo("1BV1");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    // Analyze parsed rows to see which stores are present
    const storeStats = useMemo(() => {
        const stats: Record<string, number> = { "1BN1": 0, "1BV1": 0, "Altele": 0 };
        parsedRows.forEach((r) => {
            if (r.store === "1BN1" || r.store === "1BV1") {
                stats[r.store] = (stats[r.store] || 0) + 1;
            } else {
                stats["Altele"] = (stats["Altele"] || 0) + 1;
            }
        });
        return stats;
    }, [parsedRows]);

    // First 3 rows for preview
    const previewRows = useMemo(() => parsedRows.slice(0, 3), [parsedRows]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
        }
    };

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsParsing(true);
        setParsingError(null);

        try {
            // Parse with fallback currentStore
            const rows = await parseStockSpreadsheetRows(selectedFile, currentStore);
            setParsedRows(rows);
            
            // Auto select target stores based on what stores exist in the file
            const activeStores: FilialaCode[] = [];
            if (rows.some(r => r.store === "1BN1")) activeStores.push("1BN1");
            if (rows.some(r => r.store === "1BV1")) activeStores.push("1BV1");
            
            // If no valid stores were parsed, select the currentStore as fallback
            if (activeStores.length === 0) {
                activeStores.push(currentStore);
            }
            
            setTargetStores(activeStores);
            setStep("config");
        } catch (err) {
            setParsingError(err instanceof Error ? err.message : "Nu am putut citi fișierul.");
            setFile(null);
        } finally {
            setIsParsing(false);
        }
    };

    const toggleStore = (store: FilialaCode) => {
        setTargetStores((prev) =>
            prev.includes(store)
                ? prev.filter((s) => s !== store)
                : [...prev, store]
        );
    };

    const handleStartUpload = async () => {
        if (targetStores.length === 0) return;

        setStep("progress");
        setUploadError(null);
        setUploadProgress({ phase: "snapshot", message: "Inițializare..." });

        try {
            const uploadResultsList = await executeStockUpload(parsedRows, {
                targetStores,
                mode: importMode,
                fileName: file?.name || "import_sap.xlsx",
                onProgress: setUploadProgress,
            });

            // Save undo snapshots to local storage using the hooks
            const resultsWithBackup = uploadResultsList.map((res) => {
                let backupSaved = false;
                if (res.snapshot) {
                    if (res.store === "1BN1") {
                        backupSaved = undo1BN1.saveSnapshot(res.snapshot);
                    } else if (res.store === "1BV1") {
                        backupSaved = undo1BV1.saveSnapshot(res.snapshot);
                    }
                }
                return {
                    store: res.store,
                    upserted: res.upserted,
                    zeroed: res.zeroed,
                    backupSaved,
                };
            });

            setUploadResults(resultsWithBackup);
            setStep("result");
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "A apărut o eroare la încărcare.");
            setStep("config");
        }
    };

    const resetWizard = () => {
        setFile(null);
        setParsedRows([]);
        setTargetStores([currentStore]);
        setUploadProgress(null);
        setUploadError(null);
        setStep("select");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 pt-3 sm:pt-6 overflow-y-auto bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl shadow-2xl border-border/80 bg-card/95 overflow-hidden animate-scale-in flex flex-col max-h-[96vh] sm:max-h-[90vh]">
                <CardHeader className="border-b border-border/60 p-3 sm:px-5 sm:py-3.5 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                            <Database className="size-5 text-primary" />
                            Asistent Import Stoc SAP
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs">
                            Actualizează stocurile din Supabase folosind un export XLSX din SAP
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full shrink-0">
                        <X className="size-4" />
                    </Button>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 scrollbar-thin">
                    
                    {/* Stepper Header */}
                    <div className="flex items-center justify-center gap-1 sm:gap-4 border-b border-border/40 pb-4 text-xs font-mono">
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", step === "select" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <span>1.<span className="hidden sm:inline"> Fișier</span></span>
                        </div>
                        <ChevronRight className="size-3 text-muted-foreground/50" />
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", step === "config" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <span>2.<span className="hidden sm:inline"> Configurare</span><span className="sm:hidden"> Config</span></span>
                        </div>
                        <ChevronRight className="size-3 text-muted-foreground/50" />
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", step === "progress" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <span>3.<span className="hidden sm:inline"> Upload</span></span>
                        </div>
                        <ChevronRight className="size-3 text-muted-foreground/50" />
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", step === "result" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground")}>
                            <span>4.<span className="hidden sm:inline"> Finalizat</span><span className="sm:hidden"> Gata</span></span>
                        </div>
                    </div>

                    {/* Step 1: File Selection */}
                    {step === "select" && (
                        <div className="space-y-3 py-2">
                            <div
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-xl py-6 sm:py-8 px-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5",
                                    dragActive 
                                        ? "border-primary bg-primary/5 scale-[1.01]" 
                                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                                )}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {isParsing ? (
                                    <>
                                        <Loader2 className="size-8 text-primary animate-spin" />
                                        <p className="text-xs font-medium font-mono">Se analizează fișierul...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                                            <Upload className="size-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold">
                                                Trage fișierul SAP aici sau faceți click pentru a selecta
                                            </p>
                                            <p className="text-[10px] text-muted-foreground font-mono">
                                                Suportă formate .xlsx, .xls sau .csv
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {parsingError && (
                                <div className="flex gap-2 p-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-[11px] text-destructive font-mono">
                                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Eroare citire fișier:</p>
                                        <p className="mt-0.5 opacity-90">{parsingError}</p>
                                    </div>
                                </div>
                            )}


                            <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-[10px] text-muted-foreground flex gap-2">
                                <Info className="size-3.5 text-primary shrink-0 mt-0.5 animate-pulse" />
                                <p>Fișierul (MB52) trebuie să conțină Cod Material și Cantitate. Filiala/Depozitul se identifică automat.</p>
                            </div>
                        </div>
                    )}

                      {/* Step 2: Configuration and Preview */}
                    {step === "config" && (
                        <div className="space-y-3 sm:space-y-4 animate-fade-up">
                            
                            {/* File Info Card */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600">
                                        <FileSpreadsheet className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold max-w-[200px] sm:max-w-xs truncate">{file?.name}</p>
                                        <p className="text-[9px] font-mono text-muted-foreground">
                                            {(file?.size ? file.size / 1024 : 0).toFixed(1)} KB · {parsedRows.length.toLocaleString("ro-RO")} poziții
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="xs" onClick={resetWizard} className="text-[10px] h-7">
                                    Schimbă
                                </Button>
                            </div>

                            {/* Target Stores Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground font-bold">
                                    1. Selectează filiale
                                </label>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {(["1BN1", "1BV1"] as const).map((store) => {
                                        const count = storeStats[store] || 0;
                                        const isSelected = targetStores.includes(store);
                                        return (
                                            <div
                                                key={store}
                                                onClick={() => toggleStore(store)}
                                                className={cn(
                                                    "border rounded-lg p-2.5 cursor-pointer transition-all flex items-center justify-between",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-border bg-card hover:bg-muted/30",
                                                    count === 0 && "opacity-60"
                                                )}
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-mono font-bold flex items-center gap-1.5 flex-wrap">
                                                        Filiala {store}
                                                        {count > 0 ? (
                                                            <Badge variant="secondary" className="font-mono text-[9px] px-1 py-0 h-4">
                                                                {count.toLocaleString("ro-RO")}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                                                                Lipsă
                                                            </Badge>
                                                        )}
                                                    </p>
                                                    <p className="text-[9px] text-muted-foreground">
                                                        {store === "1BN1" ? "Brasov BN" : "Brasov 1"}
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "size-4 rounded-full border flex items-center justify-center transition-colors",
                                                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
                                                )}>
                                                    {isSelected && <Check className="size-3" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {targetStores.length === 0 && (
                                    <p className="text-[10px] text-destructive font-mono flex items-center gap-1">
                                        <AlertTriangle className="size-3" /> Selectează cel puțin o filială.
                                    </p>
                                )}
                            </div>

                            {/* Mode Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground font-bold">
                                    2. Mod actualizare
                                </label>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div
                                        onClick={() => setImportMode("complete")}
                                        className={cn(
                                            "border rounded-lg p-2.5 cursor-pointer transition-all flex flex-col gap-1 text-left",
                                            importMode === "complete"
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border bg-card hover:bg-muted/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold">Înlocuire completă</p>
                                            <div className={cn(
                                                "size-3.5 rounded-full border flex items-center justify-center",
                                                importMode === "complete" ? "border-primary text-primary" : "border-border"
                                            )}>
                                                {importMode === "complete" && <span className="size-1.5 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground leading-normal">
                                            Rescrie stocul. Ce nu e în fișier devine 0.
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => setImportMode("partial")}
                                        className={cn(
                                            "border rounded-lg p-2.5 cursor-pointer transition-all flex flex-col gap-1 text-left",
                                            importMode === "partial"
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border bg-card hover:bg-muted/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold">Actualizare parțială</p>
                                            <div className={cn(
                                                "size-3.5 rounded-full border flex items-center justify-center",
                                                importMode === "partial" ? "border-primary text-primary" : "border-border"
                                            )}>
                                                {importMode === "partial" && <span className="size-1.5 rounded-full bg-primary" />}
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground leading-normal">
                                            Doar produsele din fișier sunt modificate.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Data Preview */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground font-bold">
                                    3. Previzualizare date (primele 3 rânduri)
                                </label>
                                <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10">
                                    <div className="overflow-x-auto scrollbar-thin">
                                        <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                                            <thead>
                                                <tr className="bg-muted/40 border-b border-border/60 font-mono text-[9px] text-muted-foreground uppercase">
                                                    <th className="p-2.5">Cod</th>
                                                    <th className="p-2.5">Denumire</th>
                                                    <th className="p-2.5">Magazie</th>
                                                    <th className="p-2.5 text-right">Cantitate</th>
                                                    <th className="p-2.5">Filială</th>
                                                </tr>
                                            </thead>
                                            <tbody className="font-mono divide-y divide-border/40">
                                                {previewRows.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/30">
                                                        <td className="p-2.5 font-bold">{row.code}</td>
                                                        <td className="p-2.5 max-w-[180px] truncate">{row.name}</td>
                                                        <td className="p-2.5">{row.storage}</td>
                                                        <td className="p-2.5 text-right font-medium">{row.stock} {row.unit}</td>
                                                        <td className="p-2.5">{row.store}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {uploadError && (
                                <div className="flex gap-2.5 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-destructive font-mono">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Eroare actualizare:</p>
                                        <p className="mt-0.5 opacity-90">{uploadError}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Step 3: Progress indicators */}
                    {step === "progress" && (
                        <div className="space-y-6 py-6 animate-fade-up text-center">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <Loader2 className="size-12 text-primary animate-spin" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold font-mono">{uploadProgress?.message || "Se procesează..."}</p>
                                    {uploadProgress?.current != null && uploadProgress?.total != null && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                            Progres: {uploadProgress.current.toLocaleString("ro-RO")} / {uploadProgress.total.toLocaleString("ro-RO")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Fancy Progress Bar */}
                            {uploadProgress?.current != null && uploadProgress?.total != null && (
                                <div className="w-full max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                                    <div
                                        className="h-full bg-primary transition-all duration-300 rounded-full"
                                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                    />
                                </div>
                            )}

                            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 max-w-md mx-auto leading-relaxed">
                                <p className="font-semibold flex items-center justify-center gap-1.5 mb-1 text-[10px] uppercase font-mono tracking-widest">
                                    <AlertTriangle className="size-3.5" /> Nu închideți această fereastră
                                </p>
                                <p className="opacity-90">
                                    Se scriu datele în baza de date Supabase în batch-uri optimizate pentru a asigura performanță și stabilitate.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Results report */}
                    {step === "result" && (
                        <div className="space-y-6 py-2 animate-fade-up">
                            <div className="text-center space-y-2">
                                <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                                    <CheckCircle2 className="size-10" />
                                </div>
                                <h3 className="text-base font-bold">Import finalizat cu succes!</h3>
                                <p className="text-xs text-muted-foreground">
                                    Baza de date Supabase a fost actualizată conform setărilor alese.
                                </p>
                            </div>

                            {/* Stats breakdown */}
                            <div className="space-y-3">
                                <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground font-bold">
                                    Rezumat operațiuni pe filiale
                                </p>
                                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-card">
                                    {uploadResults.map((res) => (
                                        <div key={res.store} className="p-4 flex flex-wrap items-center justify-between gap-3 bg-muted/10">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-mono font-bold">
                                                    Filiala {res.store}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {res.store === "1BN1" ? "Romstal Brasov BN" : "Romstal Brasov 1"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-mono">
                                                <div className="text-right">
                                                    <p className="font-semibold text-emerald-600">+{res.upserted.toLocaleString("ro-RO")}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase">Actualizate</p>
                                                </div>
                                                {res.zeroed > 0 && (
                                                    <div className="text-right border-l border-border/60 pl-4">
                                                        <p className="font-semibold text-amber-600">{res.zeroed.toLocaleString("ro-RO")}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">Puse la 0</p>
                                                    </div>
                                                )}
                                                <div className="text-right border-l border-border/60 pl-4">
                                                    {res.backupSaved ? (
                                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 font-mono text-[9px] bg-emerald-500/5">
                                                            Backup OK
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 font-mono text-[9px] bg-amber-500/5">
                                                            Fără Backup
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-mono">
                                <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                                    <Check className="size-4" /> Undo Disponibil
                                </p>
                                <p className="opacity-90">
                                    Snapshot-ul de backup a fost salvat în browser. În caz de greșeală, poți folosi funcția „Anulează ultimul upload” din pagina principală de stoc pentru a reveni la starea anterioară.
                                </p>
                            </div>
                        </div>
                    )}

                </CardContent>

                <CardHeader className="border-t border-border/60 p-4 sm:px-6 sm:py-4 flex flex-row items-center justify-between bg-muted/10 shrink-0">
                    <div>
                        {step === "config" && (
                            <Button
                                variant="outline"
                                onClick={() => setStep("select")}
                                className="gap-1.5 text-xs"
                            >
                                <ArrowLeft className="size-3.5" />
                                Înapoi
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step !== "progress" && step !== "result" && (
                            <Button variant="ghost" onClick={onClose} className="text-xs">
                                Închide
                            </Button>
                        )}

                        {step === "config" && (
                            <Button
                                onClick={handleStartUpload}
                                disabled={targetStores.length === 0}
                                className="gap-1.5 text-xs font-bold"
                            >
                                Pornește actualizarea
                                <ArrowRight className="size-3.5" />
                            </Button>
                        )}

                        {step === "result" && (
                            <Button onClick={onClose} className="text-xs font-bold">
                                Finalizează
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
}
