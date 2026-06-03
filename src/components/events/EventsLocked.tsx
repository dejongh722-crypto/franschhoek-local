import { useNavigate } from "react-router-dom";
import { Lock, Crown, CalendarDays, Sparkles, MessagesSquare } from "lucide-react";
import { EventListCard } from "./EventListCard";
import { useEvents } from "@/store/events";

const perks = [
  { icon: CalendarDays, label: "All events" },
  { icon: Sparkles, label: "Premium events" },
  { icon: MessagesSquare, label: "Event chat" },
];

export function EventsLocked() {
  const navigate = useNavigate();
  const { featured, upcoming } = useEvents();
  const preview = (featured.length ? featured : upcoming).slice(0, 3);

  return (
    <div className="relative px-5 py-6">
      {/* Blurred preview behind the gate */}
      <div className="pointer-events-none min-h-[280px] select-none space-y-4 opacity-60 blur-[3px]" aria-hidden>
        {preview.map((event) => (
          <EventListCard key={event.id} event={event} />
        ))}
      </div>

      {/* Gate overlay */}
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-sand/40 via-sand/80 to-sand px-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-black/5">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-wine/10 text-wine">
            <Lock className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-cta">
            <Crown className="h-4 w-4" strokeWidth={2} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Premium</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Unlock Events</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            See every event and festival in Franschhoek, save them to your calendar, and join the
            per-event community chat.
          </p>

          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {perks.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-wine/5 px-3 py-1.5 text-[11px] font-medium text-wine ring-1 ring-wine/10"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {label}
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate("/membership")}
            className="mt-5 w-full rounded-full bg-cta py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cta-hover active:scale-[0.99]"
          >
            Go Premium
          </button>
        </div>
      </div>
    </div>
  );
}
