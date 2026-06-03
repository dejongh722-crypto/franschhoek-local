import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { events as seedEvents, byDate, type AppEvent } from "@/data/events";
import type { WriteResult } from "@/store/promotions";

const FEATURED_IDS = ["sunset-wine-tasting", "harvest-long-table", "live-jazz-tapas", "cellar-barrel-tasting"];

export type EventInput = Omit<AppEvent, "id">;

interface EventsContextValue {
  events: AppEvent[];
  featured: AppEvent[];
  upcoming: AppEvent[];
  getEventById: (id?: string) => AppEvent | undefined;
  addEvent: (input: EventInput) => Promise<WriteResult>;
  removeEvent: (id: string) => Promise<WriteResult>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

interface EventRow {
  id: string;
  title: string;
  venue: string | null;
  category_slug: string | null;
  date: string | null;
  image: string | null;
  is_premium: boolean;
  price: string | null;
  has_chat: boolean;
  description: string | null;
}

function fromRow(r: EventRow): AppEvent {
  return {
    id: r.id,
    title: r.title,
    venue: r.venue ?? "",
    categorySlug: r.category_slug ?? "",
    date: r.date ?? "",
    image: r.image ?? "",
    isPremium: r.is_premium,
    price: r.price ?? "Free",
    hasChat: r.has_chat,
    description: r.description ?? "",
  };
}

function toRow(e: AppEvent) {
  return {
    id: e.id,
    title: e.title,
    venue: e.venue,
    category_slug: e.categorySlug,
    date: e.date,
    image: e.image,
    is_premium: e.isPremium,
    price: e.price,
    has_chat: e.hasChat,
    description: e.description,
  };
}

function slugId(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "event";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

const NOT_SAVED = "Couldn't save — your account needs admin access (profiles.is_admin = true).";

export function EventsProvider({ children }: { children: ReactNode }) {
  const cloud = Boolean(supabase);
  const [events, setEvents] = useState<AppEvent[]>(cloud ? [] : seedEvents);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      // Table not created yet — fall back to the bundled samples so the app still works.
      setEvents(seedEvents);
      return;
    }
    setEvents((data as EventRow[]).map(fromRow).sort(byDate));
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    void fetchAll();
    const channel = sb
      .channel("events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => void fetchAll())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [fetchAll]);

  const addEvent = useCallback(
    async (input: EventInput): Promise<WriteResult> => {
      const event: AppEvent = { ...input, id: slugId(input.title) };
      if (supabase) {
        const { data, error } = await supabase.from("events").insert(toRow(event)).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setEvents((prev) => [event, ...prev].sort(byDate));
      }
      return {};
    },
    [fetchAll],
  );

  const removeEvent = useCallback(
    async (id: string): Promise<WriteResult> => {
      if (supabase) {
        const { data, error } = await supabase.from("events").delete().eq("id", id).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
      return {};
    },
    [fetchAll],
  );

  const value = useMemo<EventsContextValue>(() => {
    const sorted = [...events].sort(byDate);
    const featured = events.filter((e) => FEATURED_IDS.includes(e.id));
    return {
      events,
      featured: featured.length > 0 ? featured : sorted.slice(0, 4),
      upcoming: sorted.slice(0, 3),
      getEventById: (id) => events.find((e) => e.id === id),
      addEvent,
      removeEvent,
    };
  }, [events, addEvent, removeEvent]);

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within an EventsProvider");
  return ctx;
}
