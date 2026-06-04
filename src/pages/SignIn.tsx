import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";

export function SignIn() {
  const navigate = useNavigate();
  const toast = useToast();
  const { configured, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "forgot") {
      if (!email.trim()) {
        toast("Enter your email");
        return;
      }
      setBusy(true);
      const result = await resetPassword(email.trim());
      setBusy(false);
      if (result.error) {
        toast(result.error);
        return;
      }
      toast("If that email exists, a reset link is on its way");
      setMode("in");
      return;
    }

    if (!email.trim() || !password) {
      toast("Enter your email and password");
      return;
    }
    setBusy(true);
    const result =
      mode === "up" ? await signUp(email.trim(), password, name.trim() || email.split("@")[0]) : await signIn(email.trim(), password);
    setBusy(false);

    if (result.error) {
      toast(result.error);
      return;
    }
    if (mode === "up") {
      toast("Account created — check your email if confirmation is on");
    } else {
      toast("Welcome back 👋");
    }
    navigate("/profile");
  };

  const heading =
    mode === "in" ? "Welcome back" : mode === "up" ? "Create account" : "Reset password";
  const subheading =
    mode === "in"
      ? "Sign in to your Franschhoek Local account."
      : mode === "up"
        ? "Join Franschhoek Local."
        : "Enter your email and we'll send you a reset link.";

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-sand">
      <header className="bg-gradient-to-br from-wine via-wine to-wine-deep px-5 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <button
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition-colors hover:bg-white/25"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <h1 className="mt-5 font-display text-3xl font-semibold">{heading}</h1>
        <p className="mt-1 text-sm text-white/75">{subheading}</p>
      </header>

      <div className="px-5 py-6">
        {!configured && (
          <p className="mb-4 rounded-2xl bg-cta/10 px-4 py-3 text-sm text-ink ring-1 ring-cta/20">
            Sign-in isn't configured yet. Add your Supabase keys to <code>.env</code> and run the schema.
          </p>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && (
            <FieldIcon icon={UserIcon}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </FieldIcon>
          )}
          <FieldIcon icon={Mail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </FieldIcon>
          {mode !== "forgot" && (
            <FieldIcon icon={Lock}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </FieldIcon>
          )}

          {mode === "in" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm font-medium text-wine"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !configured}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-wine py-3.5 text-sm font-semibold text-white transition-colors hover:bg-wine-soft disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
          </button>
        </form>

        {mode === "forgot" ? (
          <p className="mt-5 text-center text-sm text-muted">
            Remembered it?{" "}
            <button onClick={() => setMode("in")} className="font-semibold text-wine">
              Back to sign in
            </button>
          </p>
        ) : (
          <p className="mt-5 text-center text-sm text-muted">
            {mode === "in" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="font-semibold text-wine"
            >
              {mode === "in" ? "Create an account" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function FieldIcon({ icon: Icon, children }: { icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-sm ring-1 ring-line">
      <Icon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
      {children}
    </div>
  );
}
