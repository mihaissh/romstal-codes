import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit3, X, Phone, AlertCircle, FileText, User, Hash, Tag, AlignLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note, NoteTag, DocumentType } from "@/hooks/useNotes";

const AVAILABLE_TAGS: NoteTag[] = [
    "platit", "neplatit", "livrare curier", "livrare marfa",
    "ridica client", "SPEDEX", "emisa", "ne emisa",
];

const TAG_COLORS: Record<NoteTag, string> = {
    "platit": "bg-tag-category-bg text-tag-category-text border-tag-category-text/30",
    "neplatit": "bg-tag-color-bg text-tag-color-text border-tag-color-text/30",
    "livrare curier": "bg-tag-material-bg text-tag-material-text border-tag-material-text/30",
    "livrare marfa": "bg-tag-material-bg text-tag-material-text border-tag-material-text/30",
    "ridica client": "bg-tag-dimension-bg text-tag-dimension-text border-tag-dimension-text/30",
    "SPEDEX": "bg-primary text-primary-foreground border-primary/30",
    "emisa": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
    "ne emisa": "bg-destructive/10 text-destructive border-destructive/30",
};

export const DOCUMENT_TYPES: DocumentType[] = ["Factura", "Nota Livrare", "Proforma", "Oferta", "Altele"];

const CLOSE_UNMOUNT_MS = 340;

export const DOC_COLORS: Record<DocumentType, string> = {
    "Factura": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/40",
    "Nota Livrare": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
    "Proforma": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40",
    "Oferta": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/40",
    "Altele": "bg-muted/50 text-muted-foreground border-border",
};

interface FormState {
    nume: string;
    client: string;
    orderOrInvoice: string;
    documentType: DocumentType;
    phoneNumber: string;
    text: string;
    selectedTags: NoteTag[];
}

const INITIAL_STATE: FormState = {
    nume: "",
    client: "",
    orderOrInvoice: "",
    documentType: "Factura",
    phoneNumber: "",
    text: "",
    selectedTags: [],
};

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (noteData: any) => Promise<void>;
    onDelete?: (id: string) => void;
    editingNote: Note | null;
    error: string | null;
}

interface FieldLabelProps {
    icon: React.ReactNode;
    children: React.ReactNode;
}

function FieldLabel({ icon, children }: FieldLabelProps) {
    return (
        <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            <span className="opacity-70">{icon}</span>
            {children}
        </label>
    );
}

interface SidebarSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

function SidebarSection({ title, icon, children }: SidebarSectionProps) {
    return (
        <div className="py-4 border-b border-border last:border-b-0">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-muted-foreground">{icon}</span>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}

export default function NoteModal({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    editingNote,
    error: externalError,
}: NoteModalProps) {
    const [form, setForm] = useState<FormState>(INITIAL_STATE);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(isOpen);
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            return undefined;
        }
        const tid = window.setTimeout(() => setMounted(false), CLOSE_UNMOUNT_MS);
        return () => window.clearTimeout(tid);
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!mounted) return;
        if (!isOpen) {
            setEntered(false);
            return;
        }
        setEntered(false);
        let cancelled = false;
        const raf = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (!cancelled) setEntered(true);
            });
        });
        return () => {
            cancelled = true;
            window.cancelAnimationFrame(raf);
        };
    }, [mounted, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        if (editingNote) {
            setForm({
                nume: editingNote.nume,
                client: editingNote.client,
                orderOrInvoice: editingNote.orderOrInvoice,
                documentType: editingNote.documentType || "Factura",
                phoneNumber: editingNote.phone_number || "",
                text: editingNote.text || "",
                selectedTags: editingNote.tags,
            });
        } else {
            setForm(INITIAL_STATE);
        }
        setError(null);
    }, [editingNote, isOpen]);

    useEffect(() => {
        setError(externalError);
    }, [externalError]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!mounted) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [mounted]);

    useEffect(() => {
        if (isOpen && !editingNote) {
            const timer = setTimeout(() => titleInputRef.current?.focus(), 250);
            return () => clearTimeout(timer);
        }
    }, [isOpen, editingNote]);

    const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const toggleTag = useCallback((tag: NoteTag) => {
        setForm(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tag)
                ? prev.selectedTags.filter(t => t !== tag)
                : [...prev.selectedTags, tag],
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nume || !form.client || !form.orderOrInvoice || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                nume: form.nume,
                client: form.client,
                orderOrInvoice: form.orderOrInvoice,
                documentType: form.documentType,
                phone_number: form.phoneNumber.trim() || undefined,
                text: form.text.trim() || undefined,
                tags: form.selectedTags,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!editingNote || !onDelete) return;
        if (window.confirm("Sigur vrei sa stergi aceasta nota?")) {
            onDelete(editingNote.id);
            onClose();
        }
    };

    const isFormValid = form.nume.trim() && form.client.trim() && form.orderOrInvoice.trim();

    if (!mounted) return null;

    const visuallyOpen = isOpen && entered;

    return createPortal(
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
            <div
                className={cn(
                    "absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out",
                    visuallyOpen ? "opacity-100" : "opacity-0",
                )}
                onClick={() => isOpen && onClose()}
                aria-hidden="true"
            />
            <aside
                className={cn(
                    "absolute inset-y-0 right-0 w-full sm:w-[540px] md:w-[600px] bg-card shadow-2xl flex flex-col",
                    "transition-[transform] duration-300 ease-out motion-reduce:transition-none",
                    visuallyOpen ? "translate-x-0" : "translate-x-full",
                )}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <header className="shrink-0 px-5 pt-4 pb-3 border-b border-border bg-card">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                                        DOC_COLORS[form.documentType]
                                    )}>
                                        <FileText className="size-3" />
                                        {form.documentType}
                                    </span>
                                    {editingNote && (
                                        <span className="text-[11px] font-mono text-muted-foreground">
                                            #{form.orderOrInvoice || editingNote.orderOrInvoice}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    ref={titleInputRef}
                                    placeholder="Titlu nota (nume produs / proiect)..."
                                    value={form.nume}
                                    onChange={(e) => updateField("nume", e.target.value)}
                                    required
                                    className="h-9 text-base font-semibold border-transparent bg-transparent px-1 -ml-1 hover:bg-muted/40 focus:bg-background focus:border-border transition-colors"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-md size-8 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                                aria-label="Inchide"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <div className="grid md:grid-cols-[1fr_240px] gap-0">
                            <div className="px-5 py-5 space-y-5 md:border-r md:border-border">
                                <div>
                                    <FieldLabel icon={<User className="size-3.5" />}>Client</FieldLabel>
                                    <Input
                                        placeholder="Numele clientului"
                                        value={form.client}
                                        onChange={(e) => updateField("client", e.target.value)}
                                        required
                                        className="h-10 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <FieldLabel icon={<Hash className="size-3.5" />}>Numar Doc.</FieldLabel>
                                        <Input
                                            placeholder="123456"
                                            value={form.orderOrInvoice}
                                            onChange={(e) => updateField("orderOrInvoice", e.target.value.replace(/[^0-9a-zA-Z-]/g, ""))}
                                            required
                                            className="h-10 font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <FieldLabel icon={<Phone className="size-3.5" />}>Telefon</FieldLabel>
                                        <Input
                                            placeholder="07xx xxx xxx"
                                            value={form.phoneNumber}
                                            onChange={(e) => updateField("phoneNumber", e.target.value)}
                                            type="tel"
                                            className="h-10 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <FieldLabel icon={<AlignLeft className="size-3.5" />}>Detalii</FieldLabel>
                                    <Textarea
                                        placeholder="Adauga observatii, mentiuni despre comanda, marfa..."
                                        value={form.text}
                                        onChange={(e) => updateField("text", e.target.value)}
                                        className="min-h-[160px] resize-y text-sm leading-relaxed"
                                    />
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-shake">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <p className="font-medium">{error}</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-5 py-1 bg-muted/20 md:bg-transparent">
                                
                                <SidebarSection title="Tip Document" icon={<FileText className="size-3.5" />}>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {DOCUMENT_TYPES.map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => updateField("documentType", type)}
                                                className={cn(
                                                    "py-1.5 px-2 rounded-md border text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150 outline-none",
                                                    form.documentType === type
                                                        ? cn(DOC_COLORS[type], "border-2")
                                                        : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </SidebarSection>

                                <SidebarSection
                                    title={`Etichete${form.selectedTags.length > 0 ? ` (${form.selectedTags.length})` : ""}`}
                                    icon={<Tag className="size-3.5" />}
                                >
                                    <div className="flex flex-wrap gap-1">
                                        {AVAILABLE_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                className={cn(
                                                    "text-[9px] px-2 py-1 rounded border transition-colors duration-150 font-semibold uppercase tracking-wider outline-none select-none",
                                                    form.selectedTags.includes(tag)
                                                        ? TAG_COLORS[tag]
                                                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </SidebarSection>

                                {editingNote && (
                                    <SidebarSection title="Informatii" icon={<Edit3 className="size-3.5" />}>
                                        <div className="space-y-1.5 text-[10px] font-mono text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Creat:</span>
                                                <span className="text-foreground/80">
                                                    {new Date(editingNote.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {editingNote.updatedAt && (
                                                <div className="flex justify-between">
                                                    <span>Editat:</span>
                                                    <span className="text-primary/70">
                                                        {new Date(editingNote.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </SidebarSection>
                                )}
                            </div>
                        </div>
                    </div>
                    <footer className="shrink-0 px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between gap-2">
                        <div>
                            {editingNote && onDelete && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleDelete}
                                    className="h-9 px-3 gap-1.5 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="size-3.5" />
                                    Sterge
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="h-9 px-4 text-xs font-semibold"
                            >
                                Anuleaza
                            </Button>
                            <Button
                                type="submit"
                                className="h-9 px-5 gap-2 text-xs font-semibold shadow-sm"
                                disabled={!isFormValid || isSubmitting}
                            >
                                {isSubmitting ? "Se salveaza..." : editingNote ? "Salveaza" : "Adauga"}
                            </Button>
                        </div>
                    </footer>
                </form>
            </aside>
        </div>,
        document.body
    );
}
