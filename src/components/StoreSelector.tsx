import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type StoreCode = "1BN1" | "1BV1";
const STORES: StoreCode[] = ["1BN1", "1BV1"];

interface StoreSelectorProps {
    currentStore: StoreCode;
    onStoreSelect: (storeCode: StoreCode) => void;
}

const StoreSelector = memo(function StoreSelector({ currentStore, onStoreSelect }: StoreSelectorProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" className="font-mono font-semibold tracking-wider" />}
            >
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                {currentStore}
                <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {STORES.map(code => (
                    <DropdownMenuItem
                        key={code}
                        onSelect={() => onStoreSelect(code)}
                        className={`font-mono tracking-wider ${code === currentStore ? "font-bold text-primary" : ""}`}
                    >
                        {code}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

export default StoreSelector;
