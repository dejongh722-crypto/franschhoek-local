import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  CalendarDays,
  Clock,
  Crown,
  Check,
  Lock,
  MessagesSquare,
} from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { formatEventDateLong, formatEventTime } from "@/data/events";
import { useEvents } from "@/store/events";
import { useUserEvents } from "@/store/userEvents";
import { useMembership } from "@/store/membership";
import { useToast } from "@/store/toast";
import { share } from "@/lib/share";
import { localNotify } from "@/lib/notify";
import { cn } from "@/lib/utils";

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEventById } = useEvents();
  const event = getEventById(id);
  const { isSaved, toggleSaved, isAttending, toggleAttending } = useUserEvents();
  const { isPremium } = useMembership();
  const toast = useToast();

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Event not found</h1>
        <p className="mt-2 text-sm text-muted">This event may have ended or been removed.</p>
        <button
          onClick={() => navigate("/events")}
          className="mt-6 rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to events
        </button>
      </div>
    );
  }

  const cat = categoryBySlug[event.categorySlug];
  const Icon = cat?.icon;
  const saved = isSaved(event.id);
  const attending = isAttending(event.id);
  const locked = event.isPremium && !isPremium;
  const chatAvailable = event.hasChat && isPremium && attending;

  return (
    <div className="pb-8">
      {/* Image header */}
      <div className="relative h-72">
        <img src={event.image} alt={event.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

        <div className="relative flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Share"
              onClick={async () => {
                const r = await share({ title: event.title, text: `Check out ${event.title} on Franschhoek Local` });
                if (r === "copied") toast("Link copied");
                else if (r === "failed") toast("Couldn't share");
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/30"
            >
              <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <button
              aria-label={saved ? "Remove from saved" : "Save event"}
              onClick={() => {
                toggleSaved(event.id);
                toast(saved ? "Removed from saved" : "Saved to To Attend");
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/25 backdrop-blur-md transition-transform active:scale-90"
            >
              <Heart className={cn("h-[18px] w-[18px]", saved && "fill-white")} strokeWidth={2} />
            </button>
          </div>
        </div>

        {event.isPremium && (
          <span className="absolute bottom-9 left-5 flex items-center gap-1 rounded-full bg-wine/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
            <Crown className="h-3 w-3" strokeWidth={2} />
            Premium event
          </span>
        )}
      </div>

      {/* Content card pulled over the image */}
      <div className="relative -mt-5 rounded-t-3xl bg-sand px-5 pt-6">
        {cat && (
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: cat.color }}>
            {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
            {cat.name}
          </div>
        )}
        <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight text-ink">{event.title}</h1>

        {/* Info rows */}
        <div className="mt-5 space-y-3">
          <InfoRow icon={CalendarDays} label={formatEventDateLong(event.date)} />
          <InfoRow icon={Clock} label={`${formatEventTime(event.date)} · Doors open 30 min prior`} />
          <InfoRow icon={MapPin} label={event.venue} sub="Franschhoek, Western Cape" />
        </div>

        {/* About */}
        <h2 className="mt-7 font-display text-lg font-semibold text-ink">About this event</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{event.description}</p>

        {/* Community chat — only for events that have one */}
        {event.hasChat && (
          <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-wine/10 text-wine">
                <MessagesSquare className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-ink">Event community chat</h3>
                <p className="text-xs text-muted">
                  {chatAvailable
                    ? "Chat with others attending this event."
                    : "Premium members who've RSVP'd can join the conversation."}
                </p>
              </div>
              {chatAvailable ? (
                <button
                  onClick={() => navigate(`/community/${event.id}`)}
                  className="shrink-0 rounded-full bg-wine px-4 py-2 text-xs font-semibold text-white"
                >
                  Open
                </button>
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
              )}
            </div>
          </div>
        )}

        {/* Primary action */}
        <div className="mt-7">
          {locked ? (
            <div className="rounded-2xl bg-gradient-to-br from-wine to-wine-deep p-4 text-white">
              <div className="flex items-center gap-2 text-cta">
                <Crown className="h-4 w-4" strokeWidth={2} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Premium event</span>
              </div>
              <p className="mt-1.5 text-sm text-white/85">
                Upgrade to Premium to RSVP, unlock local deals and join event chats.
              </p>
              <button
                onClick={() => navigate("/membership")}
                className="mt-3 w-full rounded-full bg-cta py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-hover"
              >
                Go Premium
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <div className="text-[11px] text-muted">Price</div>
                <div className="text-lg font-bold text-wine">{event.price}</div>
              </div>
              <button
                onClick={() => {
                  toggleAttending(event.id);
                  if (attending) {
                    toast("RSVP removed");
                  } else {
                    toast("You're going 🎉");
                    localNotify("You're going 🎉", `${event.title} · ${formatEventDateLong(event.date)}`);
                  }
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-colors",
                  attending
                    ? "bg-cat-adventure/10 text-cat-adventure ring-1 ring-cat-adventure/30"
                    : "bg-wine text-white hover:bg-wine-soft",
                )}
              >
                {attending ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    You're going
                  </>
                ) : (
                  "Sign up to attend"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof MapPin;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-wine shadow-sm ring-1 ring-black/5">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{label}</div>
        {sub && <div className="text-xs text-muted">{sub}</div>}
      </div>
    </div>
  );
}
