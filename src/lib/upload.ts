import { supabase } from "@/lib/supabase";

/**
 * Upload an image to the public `media` bucket and return its public URL.
 * Requires the storage policies in supabase/storage.sql to be applied.
 */
export async function uploadImage(
  file: File,
  folder = "uploads",
): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: "Supabase is not configured." };
  if (!file.type.startsWith("image/")) return { error: "That file isn't an image." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl };
}
