/** Temporary client-side config until auth + Supabase are wired up. */

export type MembershipTier = "free" | "premium";

/**
 * Current user's membership tier. Hard-coded for now so we can build and test
 * the free/premium gating UI. Flip to "premium" to preview the unlocked state.
 * Will come from the authenticated profile once Supabase is connected.
 */
export const CURRENT_TIER: MembershipTier = "free";

function tierIsPremium(tier: MembershipTier) {
  return tier === "premium";
}

export const isPremiumMember = tierIsPremium(CURRENT_TIER);

/** Whether to expose the admin dashboard entry (owner-only). */
export const ADMIN_ENABLED = true;

/**
 * Public URL of the hosted web app. Used by the native (iOS/Android) shells to send
 * users to the web for Premium checkout, so payment is processed by Yoco on the web
 * and never goes through Apple/Google in-app purchase (which would take a commission).
 * Set VITE_PUBLIC_WEB_URL at build time to your real domain.
 */
export const WEB_APP_URL = (
  (import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined) || "https://app.franschhoeklocal.co.za"
).replace(/\/$/, "");
