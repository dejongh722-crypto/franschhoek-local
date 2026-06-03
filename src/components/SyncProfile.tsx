import { useEffect, useRef } from "react";
import { useAuth } from "@/store/auth";
import { useProfile } from "@/store/profile";
import { useMembership } from "@/store/membership";

/**
 * Mirrors the signed-in Supabase profile (name, avatar, tier) into the local
 * stores once per login, so the existing UI reflects cloud data. Renders nothing.
 */
export function SyncProfile() {
  const { profile } = useAuth();
  const { setName, setAvatar } = useProfile();
  const { setTier } = useMembership();
  const syncedId = useRef<string | null>(null);

  useEffect(() => {
    if (!profile) {
      syncedId.current = null;
      return;
    }
    if (syncedId.current === profile.id) return;
    syncedId.current = profile.id;

    if (profile.full_name) setName(profile.full_name);
    setAvatar(profile.avatar_url ?? null);
    setTier(profile.tier);
  }, [profile, setName, setAvatar, setTier]);

  return null;
}
