import { supabase } from "@/lib/supabase";

export type SuppressKind = "deal" | "event" | "venue" | "group";

/**
 * Record that an admin removed a piece of scraped content, so the scraper never
 * re-adds it. Call after a successful delete. Best-effort: a failure here doesn't
 * fail the delete (the row is already gone); the worst case is it could reappear
 * on a later scrape.
 */
export async function suppress(kind: SuppressKind, id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("suppressed_content")
    .upsert({ id, kind }, { onConflict: "id,kind" });
  if (error) console.warn(`suppress(${kind}, ${id}) failed: ${error.message}`);
}
