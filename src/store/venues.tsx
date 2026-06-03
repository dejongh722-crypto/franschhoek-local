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
import { venues as seedVenues, type Venue } from "@/data/venues";

interface VenuesContextValue {
  venues: Venue[];
  getVenueById: (id?: string) => Venue | undefined;
  updateVenue: (id: string, patch: Partial<Venue>) => Promise<{ error?: string }>;
}

const VenuesContext = createContext<VenuesContextValue | null>(null);

interface VenueRow {
  id: string;
  name: string;
  category_slug: string | null;
  description: string | null;
  address: string | null;
  image: string | null;
  website: string | null;
  phone: string | null;
}

function fromRow(r: VenueRow): Venue {
  return {
    id: r.id,
    name: r.name,
    categorySlug: r.category_slug ?? "",
    description: r.description ?? "",
    address: r.address ?? "",
    image: r.image ?? "",
    website: r.website ?? "",
    phone: r.phone ?? "",
  };
}

export function VenuesProvider({ children }: { children: ReactNode }) {
  const cloud = Boolean(supabase);
  const [venues, setVenues] = useState<Venue[]>(cloud ? [] : seedVenues);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("venues").select("*").order("name");
    if (error) {
      // Table not created yet — fall back to the bundled samples.
      setVenues(seedVenues);
      return;
    }
    setVenues((data as VenueRow[]).map(fromRow));
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    void fetchAll();
    const channel = sb
      .channel("venues-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "venues" }, () => void fetchAll())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [fetchAll]);

  const updateVenue = useCallback(
    async (id: string, patch: Partial<Venue>): Promise<{ error?: string }> => {
      if (!supabase) {
        setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
        return {};
      }
      const cols: Record<string, unknown> = {};
      if (patch.name !== undefined) cols.name = patch.name;
      if (patch.categorySlug !== undefined) cols.category_slug = patch.categorySlug;
      if (patch.description !== undefined) cols.description = patch.description;
      if (patch.address !== undefined) cols.address = patch.address;
      if (patch.image !== undefined) cols.image = patch.image;
      if (patch.website !== undefined) cols.website = patch.website;
      if (patch.phone !== undefined) cols.phone = patch.phone;
      const { data, error } = await supabase.from("venues").update(cols).eq("id", id).select();
      if (error) return { error: error.message };
      if (!data || data.length === 0) return { error: "Couldn't save — admin access required." };
      await fetchAll();
      return {};
    },
    [fetchAll],
  );

  const value = useMemo<VenuesContextValue>(
    () => ({
      venues,
      getVenueById: (id) => venues.find((v) => v.id === id),
      updateVenue,
    }),
    [venues, updateVenue],
  );

  return <VenuesContext.Provider value={value}>{children}</VenuesContext.Provider>;
}

export function useVenues() {
  const ctx = useContext(VenuesContext);
  if (!ctx) throw new Error("useVenues must be used within a VenuesProvider");
  return ctx;
}
