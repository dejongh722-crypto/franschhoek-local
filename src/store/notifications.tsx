import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { byDate, events, formatEventDate } from "@/data/events";
import { deals, formatValidUntil } from "@/data/deals";

const STORAGE_KEY = "fl.notifications.read.v1";

export type NotificationKind = "event" | "deal" | "info";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO datetime used for ordering. */
  at: string;
  /** Optional in-app route to open when tapped. */
  link?: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/** Build the notification feed from current event & deal data. */
function buildNotifications(): AppNotification[] {
  const list: AppNotification[] = [
    {
      id: "welcome",
      kind: "info",
      title: "Welcome to Franschhoek Local 👋",
      body: "Discover events, local deals and the community around town.",
      at: "2026-06-01T08:00:00",
    },
  ];

  [...events].sort(byDate).slice(0, 4).forEach((e) => {
    list.push({
      id: `evt-${e.id}`,
      kind: "event",
      title: `Upcoming: ${e.title}`,
      body: `${e.venue} · ${formatEventDate(e.date)}`,
      at: e.date,
      link: `/events/${e.id}`,
    });
  });

  deals.slice(0, 2).forEach((d) => {
    list.push({
      id: `deal-${d.id}`,
      kind: "deal",
      title: `New deal · ${d.discount}`,
      body: `${d.title} — until ${formatValidUntil(d.validUntil)}`,
      at: d.validUntil,
      link: `/deals/${d.id}`,
    });
  });

  return list.sort((a, b) => b.at.localeCompare(a.at));
}

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const notifications = useMemo(buildNotifications, []);
  const [read, setRead] = useState<Set<string>>(loadRead);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...read]));
    } catch {
      /* ignore */
    }
  }, [read]);

  const markRead = useCallback(
    (id: string) => setRead((prev) => (prev.has(id) ? prev : new Set(prev).add(id))),
    [],
  );
  const markAllRead = useCallback(
    () => setRead(new Set(notifications.map((n) => n.id))),
    [notifications],
  );

  const unreadCount = notifications.filter((n) => !read.has(n.id)).length;

  const value = useMemo<NotificationsContextValue>(
    () => ({ notifications, unreadCount, isRead: (id) => read.has(id), markRead, markAllRead }),
    [notifications, unreadCount, read, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
