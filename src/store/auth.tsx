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
      if (session?.user) void loadProfile(session.user.id);
      else setProfile(null);
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
        // Credit the promotion this user last clicked (if any) toward sign-ups.
        if (!error) trackSignupAttribution(data.user?.id);
        return error ? { error: error.message } : {};
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
