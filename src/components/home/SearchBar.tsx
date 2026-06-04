import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Hide the trailing filter button (e.g. when not needed). */
  showFilter?: boolean;
  onFilter?: () => void;
}

export function SearchBar({
  className,
  value,
  onChange,
  placeholder = "Search events, wineries, deals…",
  showFilter = true,
  onFilter,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-xl shadow-black/10 ring-1 ring-black/5",
        className,
      )}
    >
      <Search className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />
      {showFilter && (
        <button
          aria-label="Filters"
          onClick={onFilter}
          className="shrink-0 rounded-xl bg-wine p-2 text-white transition-colors hover:bg-wine-soft"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
