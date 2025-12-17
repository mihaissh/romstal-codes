import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { getCommonTerms } from "../utils/searchSynonyms";

export default function SearchHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const commonTerms = getCommonTerms();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-indigo-500/50 transition-all duration-200 group"
        title="Search help"
      >
        <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl shadow-black/20 overflow-hidden animate-slide-in-down z-50">
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Ajutor Cautare
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-700/50 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-200" />
            </button>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Termeni Comuni
              </h4>
              <div className="space-y-2">
                {commonTerms.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/50"
                  >
                    <div className="font-mono text-sm text-indigo-400 font-semibold mb-1">
                      {item.term}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Exemple de Cautare
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="bg-slate-900/30 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-yellow-400">"teava ppr 20"</span> sau{" "}
                  <span className="text-yellow-400">"tub ppr 20"</span>
                </div>
                <div className="bg-slate-900/30 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-yellow-400">"robinet FI 1/2"</span> - filet interior
                </div>
                <div className="bg-slate-900/30 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-yellow-400">"cot FE-FI 3/4"</span> - filet exterior-interior
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
