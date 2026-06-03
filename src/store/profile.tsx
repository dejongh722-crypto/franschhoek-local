import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "fl.profile.v1";

interface Persisted {
  name: string;
  notifications: boolean;
  avatar: string | null;
}

interface ProfileContextValue {
  name: string;
  notifications: boolean;
  avatar: string | null;
  setName: (name: string) => void;
  toggleNotifications: () => void;
  setAvatar: (dataUrl: string | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const DEFAULTS: Persisted = { name: "Daniel", notifications: true, avatar: null };

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULTS;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [name, setNameState] = useState(initial.name);
  const [notifications, setNotifications] = useState(initial.notifications);
  const [avatar, setAvatarState] = useState<string | null>(initial.avatar);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, notifications, avatar } satisfies Persisted));
    } catch {
      /* ignore quota errors */
    }
  }, [name, notifications, avatar]);

  const setName = useCallback((next: string) => setNameState(next.trim() || "Guest"), []);
  const toggleNotifications = useCallback(() => setNotifications((n) => !n), []);
  const setAvatar = useCallback((dataUrl: string | null) => setAvatarState(dataUrl), []);

  const value = useMemo<ProfileContextValue>(
    () => ({ name, notifications, avatar, setName, toggleNotifications, setAvatar }),
    [name, notifications, avatar, setName, toggleNotifications, setAvatar],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
