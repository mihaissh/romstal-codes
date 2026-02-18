import { memo } from "react";

interface Props {
    categories: string[];
    selected: string | null;
    onSelect: (category: string | null) => void;
}

function CategoryFilterComponent({ categories, selected, onSelect }: Props) {
    if (categories.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            <button
                onClick={() => onSelect(null)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                    !selected
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-border'
                }`}
            >
                Toate
            </button>
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => onSelect(selected === cat ? null : cat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                        selected === cat
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-border'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}

export default memo(CategoryFilterComponent);
