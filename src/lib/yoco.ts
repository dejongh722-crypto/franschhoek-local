import { supabase } from "@/lib/supabase";

/**
 * Start a Yoco hosted checkout for the chosen plan via the Edge Function.
 * Returns true if it's redirecting to Yoco, false if Yoco isn't available
 * (so the caller can fall back to the local upgrade stub in dev).
 */
export async function startYocoCheckout(plan: "monthly" | "annual"): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.functions.invoke("yoco-checkout", {
      body: { plan, origin: window.location.origin },
    });
    const redirectUrl = (data as { redirectUrl?: string } | null)?.redirectUrl;
    if (error || !redirectUrl) return false;
    window.location.href = redirectUrl;
    return true;
  } catch {
    return false;
  }
}
