import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, type ProfileRow } from "@/lib/supabase";
import { trackSignupAttribution } from "@/lib/promoMetrics";

type ProfilePatch = Partial<Pick<ProfileRow, "full_name" | "avatar_url" | "tier">>;

// New members are auto-joined to the General Community: once their account is
// active (which may be after email confirmation), we post a one-time "joined"
// message to the shared "general" room so they land in the conversation with
// everyone. The pending intent is stored locally until a session exists.
const PENDING_WELCOME_KEY = "fl.pendingWelcome.v1";

async function welcomeToGeneral(userId: string, name: string) {
  if (!supabase) return;
  // Don't double-post if this user already has a join message in the room.
  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("room", "general")
    .eq("author_id", userId)
    .limit(1);
  if (existing && existing.length > 0) return;
  await supabase.from("messages").insert({
    room: "general",
    author_id: userId,
    author_name: name || "New member",
    body: "👋 Just joined Franschhoek Local — hi everyone!",
  });
}

/** If a just-signed-up user now has a session, post their welcome once. */
async function flushPendingWelcome(userId: string) {
  let pending: { id: string; name: string } | null = null;
  try {
    const raw = localStorage.getItem(PENDING_WELCOME_KEY);
    pending = raw ? JSON.parse(raw) : null;
  } catch {
    /* ignore */
  }
  if (!pending || pending.id !== userId) return;
  try {
    localStorage.removeItem(PENDING_WELCOME_KEY);
  } catch {
    /* ignore */
  }
  await welcomeToGeneral(userId, pending.name);
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: ProfileRow | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const loadProfile = async (uid: string) => {
    if (!supabase) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((data as ProfileRow) ?? null);
  };

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    function applySession(session: Session | null) {
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadProfile(session.user.id);
        void flushPendingWelcome(session.user.id); // auto-join General Community
      } else setProfile(null);
    }

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      user,
      profile,
      isAdmin: profile?.is_admin ?? false,
      async signUp(email, password, fullName) {
        if (!supabase) return { error: "Supabase is not configured." };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) return { error: error.message };
        // Credit the promotion this user last clicked (if any) toward sign-ups.
        trackSignupAttribution(data.user?.id);
        // Queue the auto-join welcome to the General Community. It's posted as
        // soon as a session exists — immediately if email confirmation is off,
        // otherwise on their first sign-in after confirming.
        if (data.user) {
          try {
            localStorage.setItem(
              PENDING_WELCOME_KEY,
              JSON.stringify({ id: data.user.id, name: fullName }),
            );
          } catch {
            /* ignore */
          }
          if (data.session) void flushPendingWelcome(data.user.id);
        }
        return {};
      },
      async signIn(email, password) {
        if (!supabase) return { error: "Supabase is not configured." };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      },
      async signOut() {
        await supabase?.auth.signOut();
      },
      async resetPassword(email) {
        if (!supabase) return { error: "Supabase is not configured." };
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        return error ? { error: error.message } : {};
      },
      async updatePassword(password) {
        if (!supabase) return { error: "Supabase is not configured." };
        const { error } = await supabase.auth.updateUser({ password });
        return error ? { error: error.message } : {};
      },
      async refreshProfile() {
        if (user) await loadProfile(user.id);
      },
      async updateProfile(patch) {
        if (!supabase || !user) return;
        const { data } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", user.id)
          .select()
          .maybeSingle();
        if (data) setProfile(data as ProfileRow);
      },
    }),
    [loading, user, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
