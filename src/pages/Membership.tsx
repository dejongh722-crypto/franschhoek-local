import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown, Check, Tag, Sparkles, BookOpen, ShieldCheck } from "lucide-react";
import { useMembership, type BillingPlan } from "@/store/membership";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { startYocoCheckout } from "@/lib/yoco";
import { isNativePlatform, openExternal } from "@/lib/platform";
import { WEB_APP_URL } from "@/config";
import { cn } from "@/lib/utils";

const benefits = [
  { icon: Tag, title: "Local deals", desc: "Exclusive discounts from local businesses." },
  { icon: Sparkles, title: "Premium events", desc: "Access members-only and exclusive events." },
  { icon: BookOpen, title: "Local knowledge", desc: "Insider guides and curated recommendations." },
];

const plans: { id: BillingPlan; label: string; price: string; per: string; note?: string }[] = [
  { id: "monthly", label: "Monthly", price: "R19.99", per: "/ month" },
  { id: "annual", label: "Annual", price: "R203.90", per: "/ year", note: "Save 15%" },
];

export function Membership() {
  const navigate = useNavigate();
  const { isPremium, plan, upgrade, cancel, setTier } = useMembership();
  const { user, updateProfile, refreshProfile } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<BillingPlan>("annual");
  const native = isNativePlatform();

  // Preselect a plan when arriving from a native "upgrade on the web" hand-off
  // (e.g. /membership?plan=annual opened in the browser).
  useEffect(() => {
    const p = params.get("plan");
    if (p === "monthly" || p === "annual") setSelected(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle the redirect back from Yoco's hosted checkout.
  useEffect(() => {
    const status = params.get("status");
    if (!status) return;
    if (status === "success") {
      setTier("premium");
      if (user) void updateProfile({ tier: "premium" });
      void refreshProfile();
      toast("Payment received — Premium activated 🎉");
    } else if (status === "cancelled") {
      toast("Checkout cancelled");
    } else if (status === "failed") {
      toast("Payment failed — please try again");
    }
    params.delete("status");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async () => {
    // On the native apps, in-app digital purchases would incur an Apple/Google
    // commission. Send the user to the web to pay, so Yoco processes it off-store.
    if (native) {
      openExternal(`${WEB_APP_URL}/membership?plan=${selected}`);
      toast("Continue in your browser to upgrade");
      return;
    }
    const redirecting = await startYocoCheckout(selected);
    if (redirecting) return; // navigating to Yoco's hosted checkout
    // Fallback when Yoco isn't configured (dev): upgrade locally.
    upgrade(selected);
    if (user) void updateProfile({ tier: "premium" });
    toast("Welcome to Premium 🎉");
  };
  const handleCancel = () => {
    cancel();
    if (user) void updateProfile({ tier: "free" });
    toast("Membership cancelled");
  };

  return (
    <div className="pb-8">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-wine via-wine-soft to-wine-deep px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div className="pointer-events-none absolute -right-12 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-cta/20 blur-2xl" />

        <button
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>

        <div className="relative mt-5 flex items-center gap-2 text-cta">
          <Crown className="h-5 w-5" strokeWidth={2} />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Premium</span>
        </div>
        <h1 className="relative mt-1.5 font-display text-3xl font-semibold leading-tight">
          Franschhoek Local Premium
        </h1>
        <p className="relative mt-2 max-w-xs text-sm leading-relaxed text-white/80">
          Unlock everything the valley has to offer — deals, exclusive events, insider knowledge and
          community.
        </p>
      </header>

      <div className="px-5">
        {/* Benefits */}
        <div className="mt-6 space-y-3">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-wine/10 text-wine">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="text-xs leading-relaxed text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {isPremium ? (
          /* Current member */
          <div className="mt-7 rounded-3xl bg-card p-6 text-center shadow-sm ring-1 ring-line">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cat-adventure/10 text-cat-adventure">
              <ShieldCheck className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-ink">You're Premium</h2>
            <p className="mt-1 text-sm text-muted">
              {plan ? `${plan === "annual" ? "Annual" : "Monthly"} plan active.` : "Membership active."} Enjoy
              full access across the app.
            </p>
            <button
              onClick={() => navigate("/deals")}
              className="mt-5 w-full rounded-full bg-wine py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-soft"
            >
              Explore deals
            </button>
            <button
              onClick={handleCancel}
              className="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
            >
              Cancel membership
            </button>
          </div>
        ) : (
          /* Plan selection + upgrade */
          <>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {plans.map((p) => {
                const active = selected === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      "relative rounded-2xl border-2 bg-card p-4 text-left transition-colors",
                      active ? "border-wine" : "border-line",
                    )}
                  >
                    {p.note && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-cta px-2 py-0.5 text-[10px] font-bold text-white">
                        {p.note}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{p.label}</span>
                      <span
                        className={cn(
                          "grid h-5 w-5 place-items-center rounded-full border-2 transition-colors",
                          active ? "border-wine bg-wine text-white" : "border-line text-transparent",
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-2xl font-semibold text-ink">{p.price}</span>
                      <span className="text-xs text-muted">{p.per}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleUpgrade}
              className="mt-5 w-full rounded-full bg-cta py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cta-hover active:scale-[0.99]"
            >
              {native ? "Upgrade on the web" : "Upgrade to Premium"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              {native
                ? "Cancel anytime. You'll complete your upgrade securely in your browser."
                : "Cancel anytime. Secure payments via Yoco."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
