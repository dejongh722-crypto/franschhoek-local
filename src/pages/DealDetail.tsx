import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  MapPin,
  CalendarClock,
  Ticket,
  Copy,
  Check,
  Navigation,
  Lock,
  Crown,
} from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { formatValidUntil } from "@/data/deals";
import { useDeals } from "@/store/deals";
import { useMembership } from "@/store/membership";
import { useToast } from "@/store/toast";
import { share } from "@/lib/share";
import { cn } from "@/lib/utils";

export function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDealById } = useDeals();
  const deal = getDealById(id);
  const { isPremium } = useMembership();
  const toast = useToast();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Deal not found</h1>
        <p className="mt-2 text-sm text-muted">This deal may have expired or been removed.</p>
        <button
          onClick={() => navigate("/deals")}
          className="mt-6 rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to deals
        </button>
      </div>
    );
  }

  const cat = categoryBySlug[deal.categorySlug];
  const Icon = cat?.icon;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(deal.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const openDirections = () => {
    const q = encodeURIComponent(`${deal.venue}, Franschhoek, South Africa`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener");
  };

  const terms = [
    `Valid until ${formatValidUntil(deal.validUntil)}.`,
    "Present the code at the venue to redeem. One redemption per member.",
    "Cannot be combined with other offers or promotions.",
    "Subject to availability; the venue reserves the right to amend terms.",
  ];

  return (
    <div className="pb-8">
      {/* Image header */}
      <div className="relative h-64">
        <img src={deal.image} alt={deal.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

        <div className="relative flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            aria-label="Share"
            onClick={async () => {
              const r = await share({ title: deal.title, text: `${deal.discount} at ${deal.venue} — on Franschhoek Local` });
              if (r === "copied") toast("Link copied");
              else if (r === "failed") toast("Couldn't share");
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>

        <span className="absolute bottom-8 left-5 rounded-lg bg-cta px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white shadow-md">
          {deal.discount}
        </span>
      </div>

      {/* Content card */}
      <div className="relative -mt-5 rounded-t-3xl bg-sand px-5 pt-6">
        {cat && (
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: cat.color }}>
            {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
            {cat.name}
          </div>
        )}
        <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight text-ink">{deal.title}</h1>

        <div className="mt-4 space-y-3">
          <InfoRow icon={MapPin} label={deal.venue} sub="Franschhoek, Western Cape" />
          <InfoRow icon={CalendarClock} label={`Valid until ${formatValidUntil(deal.validUntil)}`} />
        </div>

        <h2 className="mt-7 font-display text-lg font-semibold text-ink">About this deal</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{deal.description}</p>

        {/* Redeem */}
        <h2 className="mt-7 font-display text-lg font-semibold text-ink">Your code</h2>
        {isPremium ? (
          <div className="mt-2">
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wine py-3.5 text-sm font-semibold text-white transition-colors hover:bg-wine-soft"
              >
                <Ticket className="h-4 w-4" strokeWidth={2} />
                Reveal code
              </button>
            ) : (
              <button
                onClick={copyCode}
                className="flex w-full items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-wine/40 bg-wine/5 px-4 py-3 transition-colors hover:bg-wine/10"
              >
                <span className="font-mono text-lg font-bold tracking-widest text-wine">{deal.code}</span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold",
                    copied ? "text-cat-adventure" : "text-wine",
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.5} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" strokeWidth={2} /> Copy
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2 rounded-2xl bg-gradient-to-br from-wine to-wine-deep p-4 text-white">
            <div className="flex items-center gap-2 text-cta">
              <Crown className="h-4 w-4" strokeWidth={2} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Premium</span>
            </div>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-white/85">
              <Lock className="h-4 w-4 shrink-0" strokeWidth={2} />
              Upgrade to Premium to reveal this code and redeem the deal.
            </p>
            <button
              onClick={() => navigate("/membership")}
              className="mt-3 w-full rounded-full bg-cta py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-hover"
            >
              Go Premium
            </button>
          </div>
        )}

        {/* Directions */}
        <button
          onClick={openDirections}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card py-3 text-sm font-semibold text-ink transition-colors hover:bg-black/[0.02]"
        >
          <Navigation className="h-4 w-4 text-wine" strokeWidth={2} />
          Get directions
        </button>

        {/* Terms */}
        <h2 className="mt-7 font-display text-lg font-semibold text-ink">Terms &amp; conditions</h2>
        <ul className="mt-2 space-y-2">
          {terms.map((t) => (
            <li key={t} className="flex gap-2 text-sm leading-relaxed text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-wine/40" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, sub }: { icon: typeof MapPin; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-wine shadow-sm ring-1 ring-black/5">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{label}</div>
        {sub && <div className="text-xs text-muted">{sub}</div>}
      </div>
    </div>
  );
}
