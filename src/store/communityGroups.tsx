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
import type { WriteResult } from "@/store/promotions";

export interface CommunityGroup {
  id: string;
  name: string;
  categorySlug: string;
  description: string;
  inviteUrl: string;
  active: boolean;
}

export type CommunityGroupInput = Omit<CommunityGroup, "id">;

interface CommunityGroupsContextValue {
  groups: CommunityGroup[];
  activeGroups: CommunityGroup[];
  addGroup: (input: CommunityGroupInput) => Promise<WriteResult>;
  removeGroup: (id: string) => Promise<WriteResult>;
}

const CommunityGroupsContext = createContext<CommunityGroupsContextValue | null>(null);

interface GroupRow {
  id: string;
  name: string;
  category_slug: string | null;
  description: string | null;
  invite_url: string;
  active: boolean;
}

function fromRow(r: GroupRow): CommunityGroup {
  return {
    id: r.id,
    name: r.name,
    categorySlug: r.category_slug ?? "",
    description: r.description ?? "",
    inviteUrl: r.invite_url,
    active: r.active,
  };
}

function slugId(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "group";
  return `grp-${base}-${Math.random().toString(36).slice(2, 6)}`;
}

const NOT_SAVED = "Couldn't save — your account needs admin access (profiles.is_admin = true).";

export function CommunityGroupsProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("community_groups").select("*").order("name");
    if (error) {
      setGroups([]); // table not created yet
      return;
    }
    setGroups((data as GroupRow[]).map(fromRow));
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    void fetchAll();
    const channel = sb
      .channel("community-groups-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_groups" },
        () => void fetchAll(),
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [fetchAll]);

  const addGroup = useCallback(
    async (input: CommunityGroupInput): Promise<WriteResult> => {
      const row = {
        id: slugId(input.name),
        name: input.name,
        category_slug: input.categorySlug || null,
        description: input.description || null,
        invite_url: input.inviteUrl,
        source: "admin",
        active: input.active,
      };
      if (supabase) {
        const { data, error } = await supabase.from("community_groups").insert(row).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setGroups((prev) => [{ ...input, id: row.id }, ...prev]);
      }
      return {};
    },
    [fetchAll],
  );

  const removeGroup = useCallback(
    async (id: string): Promise<WriteResult> => {
      if (supabase) {
        const { data, error } = await supabase.from("community_groups").delete().eq("id", id).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setGroups((prev) => prev.filter((g) => g.id !== id));
      }
      return {};
    },
    [fetchAll],
  );

  const value = useMemo<CommunityGroupsContextValue>(
    () => ({
      groups,
      activeGroups: groups.filter((g) => g.active),
      addGroup,
      removeGroup,
    }),
    [groups, addGroup, removeGroup],
  );

  return <CommunityGroupsContext.Provider value={value}>{children}</CommunityGroupsContext.Provider>;
}

export function useCommunityGroups() {
  const ctx = useContext(CommunityGroupsContext);
  if (!ctx) throw new Error("useCommunityGroups must be used within a CommunityGroupsProvider");
  return ctx;
}
