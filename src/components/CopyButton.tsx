import { useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

interface Props {
  textToCopy: string;
  className?: string;
}

export default function CopyButton({ textToCopy, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent onClick

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md transition-all duration-200 ${
        copied
          ? "bg-green-500/20 scale-110 animate-pulse"
          : "hover:bg-slate-700/50 hover:scale-105"
      } ${className}`}
      title={copied ? "Copied!" : "Copy code"}
    >
      {copied ? (
        <CheckIcon className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
      ) : (
        <ClipboardDocumentIcon className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
      )}
    </button>
  );
}
