import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CURRENT_TIER, type MembershipTier } from "@/config";

const STORAGE_KEY = "fl.membership.v1";

export type BillingPlan = "monthly" | "annual";

interface Persisted {
  tier: MembershipTier;
  plan: BillingPlan | null;
}

interface MembershipContextValue {
  tier: MembershipTier;
  isPremium: boolean;
  plan: BillingPlan | null;
  /** Upgrade to premium (stub — real Yoco flow comes later). */
  upgrade: (plan: BillingPlan) => void;
  /** Cancel / downgrade to free. */
  cancel: () => void;
  /** Set the tier directly (used to mirror the signed-in profile from Supabase). */
  setTier: (tier: MembershipTier) => void;
}

const MembershipContext = createContext<MembershipContextValue | null>(null);

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    /* ignore corrupt storage */
  }
  return { tier: CURRENT_TIER, plan: null };
}

export function MembershipProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [tier, setTier] = useState<MembershipTier>(initial.tier);
  const [plan, setPlan] = useState<BillingPlan | null>(initial.plan);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier, plan } satisfies Persisted));
    } catch {
      /* ignore quota errors */
    }
  }, [tier, plan]);

  const upgrade = useCallback((selected: BillingPlan) => {
    setTier("premium");
    setPlan(selected);
  }, []);

  const cancel = useCallback(() => {
    setTier("free");
    setPlan(null);
  }, []);

  const value = useMemo<MembershipContextValue>(
    () => ({ tier, isPremium: tier === "premium", plan, upgrade, cancel, setTier }),
    [tier, plan, upgrade, cancel],
  );

  return <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>;
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) throw new Error("useMembership must be used within a MembershipProvider");
  return ctx;
}
