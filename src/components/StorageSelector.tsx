import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type StorageLocation = "deposit" | "expo";

const LABELS: Record<StorageLocation, string> = {
    deposit: "Depozit",
    expo: "Expozitie",
};

interface StorageSelectorProps {
    currentStorage: StorageLocation;
    onStorageSelect: (storage: StorageLocation) => void;
    availableStorages: StorageLocation[];
}

const StorageSelector = memo(function StorageSelector({ currentStorage, onStorageSelect, availableStorages }: StorageSelectorProps) {
    if (availableStorages.length <= 1) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
            >
                {LABELS[currentStorage]}
                <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {availableStorages.map(storage => (
                    <DropdownMenuItem
                        key={storage}
                        onSelect={() => onStorageSelect(storage)}
                        className={storage === currentStorage ? "font-semibold text-primary" : ""}
                    >
                        {LABELS[storage]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

export default StorageSelector;
export type { StorageLocation };
