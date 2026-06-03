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

const STORAGE_KEY = "fl.promotions.v1";
const DISMISSED_KEY = "fl.promotions.dismissed.v1";

export type Audience = "all" | "free" | "premium";

export interface Promotion {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  active: boolean;
  ctaLabel?: string;
  ctaLink?: string;
  image?: string;
  /** Optional schedule window (YYYY-MM-DD). */
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export type PromotionInput = Omit<Promotion, "id" | "createdAt">;

/** Result of a write — `error` is set with a human-readable reason when it didn't persist. */
export interface WriteResult {
  error?: string;
}

/** Whether a promotion should currently show (active flag + within its schedule window). */
export function isPromoLive(promo: Promotion, now = new Date()): boolean {
  if (!promo.active) return false;
  if (promo.startsAt && new Date(promo.startsAt) > now) return false;
  if (promo.endsAt) {
    const end = new Date(promo.endsAt);
    end.setHours(23, 59, 59, 999);
    if (end < now) return false;
  }
  return true;
}

interface PromotionsContextValue {
  promotions: Promotion[];
  activePromotions: Promotion[];
  addPromotion: (input: PromotionInput) => Promise<WriteResult>;
  updatePromotion: (id: string, patch: Partial<PromotionInput>) => Promise<WriteResult>;
  removePromotion: (id: string) => Promise<WriteResult>;
  toggleActive: (id: string) => Promise<WriteResult>;
  isDismissed: (id: string) => boolean;
  dismiss: (id: string) => void;
}

const PromotionsContext = createContext<PromotionsContextValue | null>(null);

const SEED: Promotion[] = [
  {
    id: "promo-winter-wine",
    title: "Winter Wine Special 🍷",
    body: "20% off tastings at participating wineries this month. Tap to explore the latest local deals.",
    audience: "all",
    active: true,
    ctaLabel: "View deals",
    ctaLink: "/deals",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=70",
    createdAt: "2026-06-01T08:00:00",
  },
];

// ── Supabase row mapping ──
interface PromotionRow {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  active: boolean;
  cta_label: string | null;
  cta_link: string | null;
  image: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

function fromRow(r: PromotionRow): Promotion {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    audience: r.audience,
    active: r.active,
    ctaLabel: r.cta_label ?? undefined,
    ctaLink: r.cta_link ?? undefined,
    image: r.image ?? undefined,
    startsAt: r.starts_at ?? undefined,
    endsAt: r.ends_at ?? undefined,
    createdAt: r.created_at,
  };
}

function toRow(input: Partial<PromotionInput>) {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.body !== undefined) row.body = input.body;
  if (input.audience !== undefined) row.audience = input.audience;
  if (input.active !== undefined) row.active = input.active;
  if ("ctaLabel" in input) row.cta_label = input.ctaLabel ?? null;
  if ("ctaLink" in input) row.cta_link = input.ctaLink ?? null;
  if ("image" in input) row.image = input.image ?? null;
  if ("startsAt" in input) row.starts_at = input.startsAt ?? null;
  if ("endsAt" in input) row.ends_at = input.endsAt ?? null;
  return row;
}

function loadLocal(): Promotion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Promotion[];
  } catch {
    /* ignore */
  }
  return SEED;
}

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

export function PromotionsProvider({ children }: { children: ReactNode }) {
  const cloud = Boolean(supabase);
  const [promotions, setPromotions] = useState<Promotion[]>(cloud ? [] : loadLocal());
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  // Local persistence only when there's no backend.
  useEffect(() => {
    if (cloud) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promotions));
    } catch {
      /* ignore */
    }
  }, [cloud, promotions]);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
    } catch {
      /* ignore */
    }
  }, [dismissed]);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      // Table not created yet — fall back to the local seed so the app still works.
      setPromotions(loadLocal());
      return;
    }
    setPromotions((data as PromotionRow[]).map(fromRow));
  }, []);

  // Initial load + live updates when on Supabase.
  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    void fetchAll();
    const channel = sb
      .channel("promotions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "promotions" }, () => void fetchAll())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [fetchAll]);

  /** Friendly message for a write that RLS silently blocked (admin-only tables). */
  const NOT_SAVED = "Couldn't save — your account needs admin access (profiles.is_admin = true).";

  const addPromotion = useCallback(
    async (input: PromotionInput): Promise<WriteResult> => {
      if (supabase) {
        const { data, error } = await supabase.from("promotions").insert(toRow(input)).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setPromotions((prev) => [
          { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ...prev,
        ]);
      }
      return {};
    },
    [fetchAll],
  );

  const updatePromotion = useCallback(
    async (id: string, patch: Partial<PromotionInput>): Promise<WriteResult> => {
      if (supabase) {
        // .select() returns the affected rows — empty means RLS blocked it (no error is raised).
        const { data, error } = await supabase
          .from("promotions")
          .update(toRow(patch))
          .eq("id", id)
          .select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      }
      return {};
    },
    [fetchAll],
  );

  const removePromotion = useCallback(
    async (id: string): Promise<WriteResult> => {
      if (supabase) {
        const { data, error } = await supabase.from("promotions").delete().eq("id", id).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
      }
      return {};
    },
    [fetchAll],
  );

  const toggleActive = useCallback(
    async (id: string): Promise<WriteResult> => {
      const current = promotions.find((p) => p.id === id);
      if (supabase) {
        const { data, error } = await supabase
          .from("promotions")
          .update({ active: !current?.active })
          .eq("id", id)
          .select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
      }
      return {};
    },
    [fetchAll, promotions],
  );

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const value = useMemo<PromotionsContextValue>(
    () => ({
      promotions,
      activePromotions: promotions.filter((p) => p.active),
      addPromotion,
      updatePromotion,
      removePromotion,
      toggleActive,
      isDismissed: (id) => dismissed.has(id),
      dismiss,
    }),
    [promotions, dismissed, addPromotion, updatePromotion, removePromotion, toggleActive, dismiss],
  );

  return <PromotionsContext.Provider value={value}>{children}</PromotionsContext.Provider>;
}

export function usePromotions() {
  const ctx = useContext(PromotionsContext);
  if (!ctx) throw new Error("usePromotions must be used within a PromotionsProvider");
  return ctx;
}
