import { useNavigate } from "react-router-dom";
import { Crown, Tag, Sparkles, MessagesSquare } from "lucide-react";

const perks = [
  { icon: Tag, label: "Local deals" },
  { icon: Sparkles, label: "Premium events" },
  { icon: MessagesSquare, label: "Community chat" },
];

export function PremiumBanner() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-wine via-wine-soft to-wine-deep p-5 text-white shadow-lg">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-cta/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-cta" strokeWidth={2} />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-cta">Premium</span>
        </div>
        <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">
          Unlock the full experience
        </h3>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/80">
          Local deals, exclusive events and per-event community chat.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {perks.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium ring-1 ring-white/15"
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
            </li>
          ))}
        </ul>

        <button
          onClick={() => navigate("/membership")}
          className="mt-5 rounded-full bg-cta px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cta-hover active:scale-[0.98]"
        >
          Go Premium
        </button>
      </div>
    </div>
  );
}
