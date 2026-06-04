import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Bell, User } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useProfile } from "@/store/profile";
import { useNotifications } from "@/store/notifications";
import { imgFallback } from "@/lib/img";

const HERO_IMG =
  "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=70";

export function Hero() {
  const navigate = useNavigate();
  const { avatar } = useProfile();
  const { unreadCount } = useNotifications();
  const [query, setQuery] = useState("");

  const search = () => navigate(`/events${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);

  return (
    <section>
      <div className="relative h-[400px] overflow-hidden rounded-b-[2rem]">
        <img
          src={HERO_IMG}
          alt="Franschhoek wine country"
          onError={imgFallback("wineries", "hero")}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-wine/30 to-wine-deep/80" />

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-white ring-1 ring-white/25 backdrop-blur-md">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-xs font-medium">Franschhoek</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
              className="relative grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
            >
              <Bell className="h-4 w-4" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-cta px-1 text-[9px] font-bold text-white ring-2 ring-wine/40">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              aria-label="Profile"
              onClick={() => navigate("/profile")}
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Headline */}
        <div className="relative px-6 pt-12 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Welcome to wine country
          </p>
          <h1 className="mt-2 font-display text-[2.7rem] font-semibold leading-[1.02] drop-shadow-sm">
            Franschhoek
            <br />
            Local
          </h1>
          <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-white/85">
            Discover the finest wineries, restaurants & experiences around town.
          </p>
        </div>
      </div>

      {/* Floating search bar overlapping the hero */}
      <form
        className="px-5"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <SearchBar
          className="relative z-10 -mt-8"
          value={query}
          onChange={setQuery}
          placeholder="Search events…"
          showFilter={false}
        />
      </form>
    </section>
  );
}
