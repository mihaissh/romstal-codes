import { useCallback, useEffect, useRef, useState } from "react";
import type { FilialaCode } from "@/types/filiala";
import type { Product } from "@/types/Product";
import type { StockUploadProgress } from "@/types/stock-upload";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/hooks/useDebounce";
import { useStockUndo } from "@/hooks/useStockUndo";
import { parseStockSpreadsheetRows } from "@/utils/parseStockXlsx";
import { replaceStoreStockFromFile, restoreStockSnapshot } from "@/utils/stockSupabase";
import StoreSelector from "@/components/StoreSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Loader2,
    Package,
    Search,
    Upload,
    Undo2,
    AlertTriangle,
} from "lucide-react";

const PAGE_SIZE = 50;

function rowFromDb(p: Record<string, unknown>): Product {
    return {
        ...(p as unknown as Product),
        productMaterial: p.productmaterial as string | null,
        storeName: p.storename as string,
        storageDesc: (p.storagedesc ?? "") as string,
    };
}

function formatStock(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, "");
}

interface StocProps {
    store: FilialaCode;
    onStoreSelect: (store: FilialaCode) => void;
}

export default function Stoc({ store, onStoreSelect }: StocProps) {
    const { snapshot: undoSnapshot, saveSnapshot, clearSnapshot } = useStockUndo(store);

    const [rows, setRows] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filter, setFilter] = useState("");
    const debouncedFilter = useDebounce(filter.trim(), 400);
    const [listVersion, setListVersion] = useState(0);

    const [uploadBusy, setUploadBusy] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<StockUploadProgress | null>(null);
    const [uploadHint, setUploadHint] = useState<{ tone: "ok" | "err" | "warn"; text: string } | null>(
        null,
    );

    const fileRef = useRef<HTMLInputElement>(null);

    const bumpList = useCallback(() => setListVersion((v) => v + 1), []);

    useEffect(() => {
        let cancelled = false;
        async function fetchCount() {
            const { count, error } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("store", store);
            if (cancelled || error) return;
            setTotalCount(typeof count === "number" ? count : null);
        }
        fetchCount();
        return () => {
            cancelled = true;
        };
    }, [store, listVersion]);

    useEffect(() => {
        setPage(1);
    }, [store, debouncedFilter]);

    useEffect(() => {
        let cancelled = false;

        async function loadPage() {
            setLoading(true);
            setLoadError(null);
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let qb = supabase
                .from("products")
                .select("*", { count: "exact" })
                .eq("store", store);

            const q = debouncedFilter;

            if (q.length >= 2) {
                if (/^\d/.test(q)) {
                    qb = qb.ilike("code", `${q}%`).order("code", { ascending: true });
                } else {
                    qb = qb.ilike("name", `%${q}%`).order("name", { ascending: true });
                }
            } else {
                qb = qb.order("code", { ascending: true });
            }

            const { data, error, count } = await qb.range(from, to);
            if (!cancelled) {
                setLoading(false);
                if (error) {
                    setLoadError("Nu pot incarca lista din baza de date.");
                    setRows([]);
                    return;
                }
                setRows((data ?? []).map((r) => rowFromDb(r as unknown as Record<string, unknown>)));
                if (typeof count === "number") setTotalCount(count);
            }
        }

        loadPage();
        return () => {
            cancelled = true;
        };
    }, [store, page, debouncedFilter, listVersion]);

    const handleFile = async (list: FileList | null) => {
        const f = list?.[0];
        if (!f) return;

        let parsedCount = 0;
        try {
            const preview = await parseStockSpreadsheetRows(f, store);
            parsedCount = preview.length;
        } catch (e) {
            setUploadHint({
                tone: "err",
                text: e instanceof Error ? e.message : "Eroare la citirea fisierului.",
            });
            if (fileRef.current) fileRef.current.value = "";
            return;
        }

        const ok = window.confirm(
            `Inlocuiesti TOT stocul pentru ${store} in Supabase?\n\n` +
                `• ${parsedCount.toLocaleString("ro-RO")} pozitii din fisier vor fi scrise/actualizate\n` +
                `• Produsele din ${store} care NU sunt in fisier vor primi stoc 0\n` +
                `• Poti reveni o singura data cu „Anuleaza ultimul upload”\n\n` +
                `Fisier: ${f.name}`,
        );
        if (!ok) {
            if (fileRef.current) fileRef.current.value = "";
            return;
        }

        setUploadBusy(true);
        setUploadHint(null);
        setUploadProgress({ phase: "snapshot", message: "Pornire…" });

        try {
            const fileRows = await parseStockSpreadsheetRows(f, store);
            const { snapshot, upserted, zeroed } = await replaceStoreStockFromFile(
                store,
                fileRows,
                {
                    fileName: f.name,
                    onProgress: setUploadProgress,
                },
            );

            const backupSaved = saveSnapshot(snapshot);
            setUploadHint({
                tone: backupSaved ? "ok" : "warn",
                text: backupSaved
                    ? `Stoc ${store} actualizat in Supabase: ${upserted.toLocaleString("ro-RO")} din fisier, ${zeroed.toLocaleString("ro-RO")} pozitii puse la 0 (lipsa din fisier).`
                    : `Stoc ${store} actualizat in Supabase (${upserted.toLocaleString("ro-RO")} + ${zeroed.toLocaleString("ro-RO")} la 0), dar backup-ul pentru anulare nu a putut fi salvat in browser (catalog prea mare).`,
            });
            bumpList();
        } catch (e) {
            setUploadHint({
                tone: "err",
                text: e instanceof Error ? e.message : "Eroare la upload.",
            });
        } finally {
            setUploadBusy(false);
            setUploadProgress(null);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const handleUndo = async () => {
        if (!undoSnapshot) return;

        const when = new Date(undoSnapshot.createdAt).toLocaleString("ro-RO");
        const ok = window.confirm(
            `Anulezi ultimul upload pentru ${store}?\n\n` +
                `Se restaureaza stocul dinainte de „${undoSnapshot.fileName || "upload"}” (${when}).\n` +
                `${undoSnapshot.entries.length.toLocaleString("ro-RO")} pozitii vor fi rescrise in Supabase.`,
        );
        if (!ok) return;

        setUploadBusy(true);
        setUploadHint(null);
        setUploadProgress({ phase: "upsert", message: "Restaurare…" });

        try {
            const n = await restoreStockSnapshot(undoSnapshot, setUploadProgress);
            clearSnapshot();
            setUploadHint({
                tone: "ok",
                text: `Stoc restaurat pentru ${store}: ${n.toLocaleString("ro-RO")} pozitii.`,
            });
            bumpList();
        } catch (e) {
            setUploadHint({
                tone: "err",
                text: e instanceof Error ? e.message : "Eroare la restaurare.",
            });
        } finally {
            setUploadBusy(false);
            setUploadProgress(null);
        }
    };

    const totalPages =
        totalCount != null && totalCount > 0
            ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
            : 1;

    const storeLabelLong = store === "1BV1" ? "Romstal Brasov 1 (1BV1)" : "Romstal Brasov BN (1BN1)";

    return (
        <div className="space-y-6 animate-fade-up">
            <Card className="border-border/70">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                                <Package className="size-4 text-primary shrink-0" />
                                Situație stoc
                                <Badge variant="secondary" className="font-mono text-[10px]">
                                    Supabase · {PAGE_SIZE}/pagină
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs mt-1.5 max-w-xl leading-relaxed">
                                Upload-ul înlocuiește stocul pentru filiala{" "}
                                <span className="font-mono font-semibold">{store}</span> în baza de
                                date. Înainte de fiecare upload se salvează o copie pentru{" "}
                                <strong>o singură anulare</strong> (în acest browser).
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <StoreSelector currentStore={store} onStoreSelect={onStoreSelect} />
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="gap-1.5 font-mono"
                                disabled={uploadBusy}
                                onClick={() => fileRef.current?.click()}
                            >
                                {uploadBusy ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Upload className="size-4" />
                                )}
                                Înlocuiește stoc {store}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={uploadBusy || !undoSnapshot}
                                onClick={handleUndo}
                                title={
                                    undoSnapshot
                                        ? `Backup: ${undoSnapshot.fileName} · ${new Date(undoSnapshot.createdAt).toLocaleString("ro-RO")}`
                                        : undefined
                                }
                            >
                                <Undo2 className="size-4" />
                                Anulează ultimul upload
                            </Button>
                        </div>
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        hidden
                        onChange={(e) => handleFile(e.target.files)}
                    />
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-2 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                            La upload, toate pozițiile din fișier actualizează Supabase pentru{" "}
                            <span className="font-mono">{store}</span>. Orice produs din această
                            filială care <strong>nu</strong> apare în fișier primește{" "}
                            <strong>stoc 0</strong>.
                        </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono leading-relaxed bg-muted/30 rounded-lg px-3 py-2 border border-border/40">
                        Format EXPORT SAP: <strong>Material</strong>, <strong>Fără restr.</strong>,{" "}
                        <strong>Loc de depozitare</strong>, <strong>Unitate logistică</strong> (
                        1BN1 / 1BV1).
                    </p>
                    {uploadProgress ? (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-mono space-y-1">
                            <p>{uploadProgress.message}</p>
                            {uploadProgress.total != null && uploadProgress.current != null ? (
                                <p className="text-muted-foreground">
                                    {uploadProgress.current.toLocaleString("ro-RO")} /{" "}
                                    {uploadProgress.total.toLocaleString("ro-RO")}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                    {uploadHint ? (
                        <div
                            className={cn(
                                "rounded-lg border px-3 py-2 text-xs font-mono",
                                uploadHint.tone === "ok"
                                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200"
                                    : uploadHint.tone === "warn"
                                      ? "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100"
                                      : "border-destructive/30 bg-destructive/5 text-destructive",
                            )}
                        >
                            {uploadHint.text}
                        </div>
                    ) : null}
                    {undoSnapshot ? (
                        <p className="text-[10px] font-mono text-muted-foreground">
                            Backup anulare: {undoSnapshot.entries.length.toLocaleString("ro-RO")}{" "}
                            poziții · {undoSnapshot.fileName || "upload"} ·{" "}
                            {new Date(undoSnapshot.createdAt).toLocaleString("ro-RO")}
                        </p>
                    ) : null}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Cod (prefix) sau parte din denumire (minim 2 caractere)…"
                            className="pl-9 h-11 font-mono text-sm bg-background/70"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    {loadError ? (
                        <p className="text-sm text-destructive font-medium">{loadError}</p>
                    ) : null}
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                            Filială
                        </p>
                        <p className="font-mono text-lg mt-2 font-semibold">{storeLabelLong}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                            Produse în DB ({store})
                        </p>
                        <p className="font-mono text-xl font-bold mt-2">
                            {loading ? (
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            ) : (
                                (totalCount ?? rows.length)?.toLocaleString("ro-RO")
                            )}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                            Pagină
                        </p>
                        <p className="font-mono text-xl font-bold mt-2 tabular-nums">
                            {page} / {totalPages}
                        </p>
                        <div className="flex gap-2 mt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Înapoi
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Înainte
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 font-mono">
                        <Package className="size-4" /> Randuri {store}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-px">
                    <div className="overflow-x-auto scrollbar-thin max-h-[min(70vh,720px)]">
                        <table className="w-full text-sm border-collapse min-w-[560px]">
                            <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_var(--color-border)]">
                                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                                    <th className="p-3 w-[120px]">Cod</th>
                                    <th className="p-3 min-w-[200px]">Denumire</th>
                                    <th className="p-3 w-[80px]">Magaz.</th>
                                    <th className="p-3 w-[70px]">UM</th>
                                    <th className="p-3 w-[100px] tabular-nums">Stoc</th>
                                </tr>
                            </thead>
                            <tbody className="font-mono tabular-nums text-xs [&_td]:border-b [&_td]:border-border/40">
                                {!loading &&
                                    rows.map((p) => (
                                        <tr
                                            key={`${p.code}-${p.storage}`}
                                            className="hover:bg-muted/40"
                                        >
                                            <td className="p-3 font-semibold">{p.code}</td>
                                            <td className="p-3 leading-snug whitespace-normal align-top">
                                                {p.name}
                                            </td>
                                            <td className="p-3 text-muted-foreground">{p.storage}</td>
                                            <td className="p-3">{p.unit}</td>
                                            <td className="p-3 font-medium">
                                                {formatStock(p.stock)}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    {!loading && rows.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-xs font-mono px-6">
                            Niciun rezultat.
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
