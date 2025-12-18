import { memo } from "react";
import { ClockIcon, XMarkIcon, TrashIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { Product } from "../types/Product";
import type { HistoryItem } from "../hooks/useSearchHistory";

interface Props {
  history: Product[];
  historyItems: HistoryItem[];
  onSelectProduct: (product: Product) => void;
  onDeleteItem: (materialCode: string) => void;
  onClearAll: () => void;
}

function SearchHistoryComponent({
  history,
  historyItems,
  onSelectProduct,
  onDeleteItem,
  onClearAll,
}: Props) {
  if (history.length === 0) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };


  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/30 backdrop-blur-md border border-slate-700/50 shadow-2xl shadow-black/20 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 px-6 py-5 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
            <ClockIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">
              Recent Searches
            </h3>
            <p className="text-xs text-slate-400">{history.length} item{history.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 hover:border-red-500/60 rounded-lg transition-all duration-200 group hover:scale-105"
            title="Clear all history"
          >
            <TrashIcon className="w-4 h-4 text-red-400 group-hover:text-red-300" />
            <span className="text-xs font-bold text-red-400 group-hover:text-red-300 uppercase tracking-wider">
              Clear
            </span>
          </button>
        )}
      </div>

      {/* History Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyItems.map((item, index) => {
            const product = item.product;

            return (
              <div
                key={product.Material}
                className="group relative bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/60 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-105 animate-slide-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onSelectProduct(product)}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(product.Material);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-700/60 hover:bg-red-500/30 border border-slate-600/50 hover:border-red-500/60 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                  title="Remove from history"
                >
                  <XMarkIcon className="w-4 h-4 text-slate-300 hover:text-red-400" />
                </button>

                {/* Index Badge */}
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-500/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-300">{index + 1}</span>
                </div>

                {/* Content */}
                <div className="p-4 pt-10">
                  {/* Product Code */}
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Product Code</p>
                    <p className="font-mono text-sm font-bold text-indigo-400 break-all">
                      {product.Material}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 min-h-9">
                    {product["Descriere material"]}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0 mb-3"></div>

                  {/* Time Badge */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-700/30 px-2.5 py-1 rounded-md border border-slate-600/30">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatTime(item.timestamp)}</span>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-3 right-3 text-indigo-400/0 group-hover:text-indigo-400 transition-all duration-200 group-hover:translate-x-1">
                    <ChevronRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(SearchHistoryComponent);
