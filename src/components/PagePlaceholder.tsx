import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Temporary stub used while pages are built out. */
export function PagePlaceholder({ title, description, icon: Icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wine/10 text-wine">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      <span className="mt-6 rounded-full bg-ink/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
        Coming soon
      </span>
    </div>
  );
}
