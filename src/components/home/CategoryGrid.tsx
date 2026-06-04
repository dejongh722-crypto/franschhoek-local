import { useNavigate } from "react-router-dom";
import { Check, LayoutGrid, type LucideIcon } from "lucide-react";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

interface Props {
  /**
   * Filter mode. When provided, tiles act as a single-select filter (with an
   * "All" tile) and call `onSelect` instead of navigating. Omit for the default
   * navigation mode used on Home.
   */
  selectable?: boolean;
  selected?: string | null;
  onSelect?: (slug: string | null) => void;
}

interface Tile {
  slug: string | null;
  name: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Responsive, mobile-first category grid — the app-wide standard for showing
 * categories. 4 columns on phones (every category visible at a glance),
 * widening to 5 on larger viewports. Used for both browsing (Home) and
 * filtering (Events).
 */
export function CategoryGrid({ selectable = false, selected = null, onSelect }: Props) {
  const navigate = useNavigate();

  const tiles: Tile[] = [
    ...(selectable
      ? [{ slug: null, name: "All", icon: LayoutGrid, color: "var(--color-muted)" } as Tile]
      : []),
    ...categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, color: c.color })),
  ];

  const hasSelection = selectable && selected !== null;

  return (
    <div className="grid grid-cols-4 justify-items-center gap-x-2 gap-y-4 px-5">
      {tiles.map(({ slug, name, icon: Icon, color }) => {
        const isActive = selectable && slug === selected;
        const dimmed = hasSelection && !isActive;

        const handleClick = () => {
          if (selectable) onSelect?.(slug);
          else navigate(slug ? `/venues?category=${slug}` : "/venues");
        };

        return (
          <button
            key={slug ?? "all"}
            onClick={handleClick}
            className={cn(
              "flex w-full flex-col items-center gap-2 transition-all active:scale-95",
              dimmed && "opacity-50",
            )}
          >
            <span className="relative">
              <span
                className={cn(
                  "grid h-[58px] w-[58px] place-items-center rounded-full shadow-sm ring-1 ring-black/5 transition-transform",
                  isActive && "scale-105",
                )}
                style={{ backgroundColor: color }}
              >
                <Icon className="h-7 w-7 text-white" strokeWidth={1.75} />
              </span>
              {isActive && (
                <span
                  className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-card shadow ring-1 ring-black/5"
                  style={{ color }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </span>
            <span
              className={cn(
                "line-clamp-2 block min-h-[1.9rem] w-full text-center text-[11px] leading-tight",
                isActive ? "font-bold" : "font-medium text-ink",
              )}
              style={isActive ? { color } : undefined}
            >
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
