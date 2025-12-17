import type { TextSegment } from "../utils/highlightUtils";

interface Props {
  segments: TextSegment[];
  searchHighlightClassName?: string;
  diameterHighlightClassName?: string;
  threadHighlightClassName?: string;
  className?: string;
}

export default function HighlightedText({
  segments,
  searchHighlightClassName = "text-emerald-400 font-semibold",
  diameterHighlightClassName = "text-sky-400 font-semibold",
  threadHighlightClassName = "text-violet-400 font-semibold",
  className = "",
}: Props) {
  return (
    <span className={className}>
      {segments.map((segment, idx) => {
        if (!segment.isHighlighted) {
          return <span key={idx}>{segment.text}</span>;
        }

        // Determine highlight class based on type
        const highlightClass = segment.type === 'diameter'
          ? diameterHighlightClassName
          : segment.type === 'thread'
            ? threadHighlightClassName
            : segment.type === 'search'
              ? searchHighlightClassName
              : searchHighlightClassName; // Default to search highlight

        return (
          <span key={idx} className={highlightClass}>
            {segment.text}
          </span>
        );
      })}
    </span>
  );
}
