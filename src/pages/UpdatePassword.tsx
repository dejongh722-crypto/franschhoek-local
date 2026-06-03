import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export function UpdatePassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const { updatePassword } = useAuth();
  // Did we arrive via a valid recovery link? Supabase establishes a session
  // from the URL and fires PASSWORD_RECOVERY; we also check any existing session.
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast("Passwords don't match");
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) {
      toast(result.error);
      return;
    }
    toast("Password updated — you're signed in 🎉");
    navigate("/profile");
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-sand">
      <header className="bg-gradient-to-br from-wine via-wine to-wine-deep px-5 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <button
          aria-label="Back"
          onClick={() => navigate("/signin")}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition-colors hover:bg-white/25"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <h1 className="mt-5 font-display text-3xl font-semibold">New password</h1>
        <p className="mt-1 text-sm text-white/75">Choose a new password for your account.</p>
      </header>

      <div className="px-5 py-6">
        {!isSupabaseConfigured ? (
          <p className="rounded-2xl bg-cta/10 px-4 py-3 text-sm text-ink ring-1 ring-cta/20">
            Sign-in isn't configured yet. Add your Supabase keys to <code>.env</code>.
          </p>
        ) : !ready ? (
          <p className="rounded-2xl bg-cta/10 px-4 py-3 text-sm text-ink ring-1 ring-cta/20">
            This page works from the reset link in your email. Open that link, or{" "}
            <button onClick={() => navigate("/signin")} className="font-semibold text-wine">
              request a new one
            </button>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <FieldIcon icon={Lock}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </FieldIcon>
            <FieldIcon icon={Lock}>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </FieldIcon>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-wine py-3.5 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function FieldIcon({ icon: Icon, children }: { icon: typeof Lock; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5">
      <Icon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
      {children}
    </div>
  );
}
