interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: Props) {
  return (
    <div className="flex items-end justify-between px-5">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold text-wine transition-opacity hover:opacity-70">
          {action}
        </button>
      )}
    </div>
  );
}
