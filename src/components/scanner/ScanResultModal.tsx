import { Loader2, Package, X, AlertCircle } from "lucide-react";
import type { Product } from "@/types/Product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardAction,
} from "@/components/ui/card";

type ScanResultModalProps =
    | {
          status: "loading";
          onClose: () => void;
      }
    | {
          status: "found";
          product: Product;
          storageNote?: string;
          quantity: number;
          onQuantityChange: (value: number) => void;
          onAdd: () => void;
          onCancel: () => void;
          addDisabled?: boolean;
      }
    | {
          status: "error";
          code: string;
          message: string;
          onClose: () => void;
      };

export default function ScanResultModal(props: ScanResultModalProps) {
    const handleBackdropClick = () => {
        if (props.status === "found") props.onCancel();
        else props.onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
            role="presentation"
        >
            <Card
                className="w-full max-w-md shadow-2xl animate-scale-in overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="scan-result-title"
                onClick={(e) => e.stopPropagation()}
            >
                {props.status === "loading" && (
                    <>
                        <CardHeader>
                            <CardTitle
                                id="scan-result-title"
                                className="flex items-center gap-2 text-primary text-base"
                            >
                                <Loader2 className="size-5 animate-spin" />
                                Căutare produs…
                            </CardTitle>
                            <CardAction>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={props.onClose}
                                    className="rounded-full"
                                    aria-label="Închide"
                                >
                                    <X className="size-4" />
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-sm text-muted-foreground font-mono">
                                Se verifică codul în baza de date…
                            </p>
                        </CardContent>
                    </>
                )}

                {props.status === "found" && (
                    <>
                        <CardHeader>
                            <CardTitle
                                id="scan-result-title"
                                className="text-base sm:text-lg font-bold leading-snug"
                            >
                                {props.product.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-2 pb-6">
                            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                                    Cod produs
                                </p>
                                <p className="font-mono text-lg font-semibold text-primary">
                                    {props.product.code}
                                </p>
                            </div>

                            {props.storageNote ? (
                                <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                                    Magazinare: {props.storageNote}
                                </p>
                            ) : null}

                            <div className="space-y-2">
                                <label
                                    htmlFor="scan-quantity"
                                    className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5"
                                >
                                    <Package className="size-3.5" />
                                    Cantitate
                                    {props.product.unit ? (
                                        <span className="font-mono normal-case">
                                            ({props.product.unit})
                                        </span>
                                    ) : null}
                                </label>
                                <Input
                                    id="scan-quantity"
                                    type="number"
                                    min={1}
                                    step={1}
                                    inputMode="numeric"
                                    className="h-12 font-mono text-lg tabular-nums"
                                    value={props.quantity > 0 ? props.quantity : ""}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        props.onQuantityChange(Number.isNaN(v) ? 0 : Math.max(0, v));
                                    }}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 font-mono"
                                    onClick={props.onCancel}
                                >
                                    Anulează
                                </Button>
                                <Button
                                    type="button"
                                    variant="default"
                                    className="flex-1 font-mono"
                                    onClick={props.onAdd}
                                    disabled={props.addDisabled}
                                >
                                    Adaugă
                                </Button>
                            </div>
                        </CardContent>
                    </>
                )}

                {props.status === "error" && (
                    <>
                        <CardHeader>
                            <CardTitle
                                id="scan-result-title"
                                className="flex items-center gap-2 text-destructive text-base"
                            >
                                <AlertCircle className="size-5 shrink-0" />
                                Produs negăsit
                            </CardTitle>
                            <CardAction>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={props.onClose}
                                    className="rounded-full"
                                    aria-label="Închide"
                                >
                                    <X className="size-4" />
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-6">
                            <p className="font-mono text-sm text-muted-foreground">
                                Cod: <span className="font-semibold text-foreground">{props.code}</span>
                            </p>
                            <p className="text-sm leading-relaxed">{props.message}</p>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full font-mono"
                                onClick={props.onClose}
                            >
                                Închide
                            </Button>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
