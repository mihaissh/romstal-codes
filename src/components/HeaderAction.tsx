import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    description?: string;
    className?: string;
}

export default function HeaderAction({ onClick, icon, label, description, className }: Props) {
    return (
        <Tooltip>
            <TooltipTrigger
                className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "rounded-full bg-background/50 shadow-sm",
                    className
                )}
                onClick={onClick}
                aria-label={label}
            >
                {icon}
            </TooltipTrigger>
            <TooltipContent>
                <p className="text-[10px] font-mono uppercase tracking-widest">{description || label}</p>
            </TooltipContent>
        </Tooltip>
    );
}
