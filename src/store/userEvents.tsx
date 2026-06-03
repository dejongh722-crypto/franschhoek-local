import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "fl.userEvents.v1";

interface Persisted {
  saved: string[];
  attending: string[];
}

interface UserEventsContextValue {
  savedIds: Set<string>;
  attendingIds: Set<string>;
  isSaved: (id: string) => boolean;
  isAttending: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  toggleAttending: (id: string) => void;
}

const UserEventsContext = createContext<UserEventsContextValue | null>(null);

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    /* ignore corrupt storage */
  }
  return { saved: [], attending: [] };
}

export function UserEventsProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(initial.saved));
  const [attendingIds, setAttendingIds] = useState<Set<string>>(() => new Set(initial.attending));

  useEffect(() => {
    const data: Persisted = { saved: [...savedIds], attending: [...attendingIds] };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
  }, [savedIds, attendingIds]);

  const toggle = (setter: typeof setSavedIds) => (id: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSaved = useCallback(toggle(setSavedIds), []);
  const toggleAttending = useCallback(toggle(setAttendingIds), []);

  const value = useMemo<UserEventsContextValue>(
    () => ({
      savedIds,
      attendingIds,
      isSaved: (id) => savedIds.has(id),
      isAttending: (id) => attendingIds.has(id),
      toggleSaved,
      toggleAttending,
    }),
    [savedIds, attendingIds, toggleSaved, toggleAttending],
  );

  return <UserEventsContext.Provider value={value}>{children}</UserEventsContext.Provider>;
}

export function useUserEvents() {
  const ctx = useContext(UserEventsContext);
  if (!ctx) throw new Error("useUserEvents must be used within a UserEventsProvider");
  return ctx;
}
