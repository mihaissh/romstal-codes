import { ClockIcon, XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { Product } from "../types/Product";

interface Props {
  history: Product[];
  onSelectProduct: (product: Product) => void;
  onDeleteItem: (materialCode: string) => void;
  onClearAll: () => void;
}

export default function SearchHistory({
  history,
  onSelectProduct,
  onDeleteItem,
  onClearAll,
}: Props) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 shadow-xl shadow-black/10 overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Recent Searches
          </h3>
          <span className="text-xs text-slate-500">({history.length})</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 group"
            title="Clear all history"
          >
            <TrashIcon className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300" />
            <span className="text-xs font-semibold text-red-400 group-hover:text-red-300">
              Clear All
            </span>
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {history.map((product) => (
            <div
              key={product.Material}
              className="group relative bg-slate-900/30 hover:bg-slate-900/50 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer"
              onClick={() => onSelectProduct(product)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(product.Material);
                }}
                className="absolute top-2 right-2 p-1 rounded-md bg-slate-800/80 hover:bg-red-500/20 border border-slate-700/50 hover:border-red-500/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Remove from history"
              >
                <XMarkIcon className="w-3 h-3 text-slate-400 hover:text-red-400" />
              </button>

              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {product.Material}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {product["Descriere material"]}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Stock:</span>
                  <span
                    className={`text-xs font-semibold ${
                      product["Fără restr."] === 0
                        ? "text-red-400"
                        : product["Fără restr."] < 10
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {product["Fără restr."]}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {product["Unitate de bază"]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
