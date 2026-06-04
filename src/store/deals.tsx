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
import { suppress } from "@/lib/suppress";
import { deals as seedDeals, type Deal } from "@/data/deals";
import type { WriteResult } from "@/store/promotions";

export type DealInput = Omit<Deal, "id">;

interface DealsContextValue {
  deals: Deal[];
  getDealById: (id?: string) => Deal | undefined;
  addDeal: (input: DealInput) => Promise<WriteResult>;
  removeDeal: (id: string) => Promise<WriteResult>;
}

const DealsContext = createContext<DealsContextValue | null>(null);

interface DealRow {
  id: string;
  title: string;
  venue: string | null;
  category_slug: string | null;
  discount: string | null;
  description: string | null;
  code: string | null;
  valid_until: string | null;
  image: string | null;
  source_url: string | null;
}

function fromRow(r: DealRow): Deal {
  return {
    id: r.id,
    title: r.title,
    venue: r.venue ?? "",
    categorySlug: r.category_slug ?? "",
    discount: r.discount ?? "",
    description: r.description ?? "",
    code: r.code ?? "",
    validUntil: r.valid_until ?? "",
    image: r.image ?? "",
    sourceUrl: r.source_url ?? undefined,
  };
}

function toRow(d: Deal) {
  return {
    id: d.id,
    title: d.title,
    venue: d.venue,
    category_slug: d.categorySlug,
    discount: d.discount,
    description: d.description,
    code: d.code,
    valid_until: d.validUntil,
    image: d.image,
  };
}

function slugId(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "deal";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

const NOT_ADMIN = "Couldn't save — your account needs admin access (profiles.is_admin = true).";
const NOT_SIGNED_IN = "You're not signed in. Sign in with your admin account to manage content.";

/** Why a write affected 0 rows: not signed in, or signed in without admin rights. */
async function blockedReason(): Promise<string> {
  if (!supabase) return NOT_ADMIN;
  const { data } = await supabase.auth.getSession();
  return data.session ? NOT_ADMIN : NOT_SIGNED_IN;
}

export function DealsProvider({ children }: { children: ReactNode }) {
  const cloud = Boolean(supabase);
  const [deals, setDeals] = useState<Deal[]>(cloud ? [] : seedDeals);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("deals").select("*");
    if (error) {
      setDeals(seedDeals);
      return;
    }
    setDeals((data as DealRow[]).map(fromRow));
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    void fetchAll();
    const channel = sb
      .channel("deals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => void fetchAll())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [fetchAll]);

  const addDeal = useCallback(
    async (input: DealInput): Promise<WriteResult> => {
      const deal: Deal = { ...input, id: slugId(input.title) };
      if (supabase) {
        const { data, error } = await supabase.from("deals").insert(toRow(deal)).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: await blockedReason() };
        await fetchAll();
      } else {
        setDeals((prev) => [deal, ...prev]);
      }
      return {};
    },
    [fetchAll],
  );

  const removeDeal = useCallback(
    async (id: string): Promise<WriteResult> => {
      if (supabase) {
        const { data, error } = await supabase.from("deals").delete().eq("id", id).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: await blockedReason() };
        await suppress("deal", id); // don't let the scraper re-add it
        await fetchAll();
      } else {
        setDeals((prev) => prev.filter((d) => d.id !== id));
      }
      return {};
    },
    [fetchAll],
  );

  const value = useMemo<DealsContextValue>(
    () => ({
      deals,
      getDealById: (id) => deals.find((d) => d.id === id),
      addDeal,
      removeDeal,
    }),
    [deals, addDeal, removeDeal],
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

export function useDeals() {
  const ctx = useContext(DealsContext);
  if (!ctx) throw new Error("useDeals must be used within a DealsProvider");
  return ctx;
}
