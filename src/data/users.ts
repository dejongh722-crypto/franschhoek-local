/** Sample member list for the admin dashboard — replaced by Supabase data later. */

export interface AdminUser {
  name: string;
  email: string;
  tier: "free" | "premium";
  joined: string; // ISO date
}

export const recentUsers: AdminUser[] = [
  { name: "Thandi Mokoena", email: "thandi.m@example.com", tier: "premium", joined: "2026-05-28" },
  { name: "James Kruger", email: "james.k@example.com", tier: "premium", joined: "2026-05-24" },
  { name: "Sophie Roux", email: "sophie.r@example.com", tier: "free", joined: "2026-05-21" },
  { name: "Marco da Silva", email: "marco.d@example.com", tier: "free", joined: "2026-05-18" },
  { name: "Aisha Patel", email: "aisha.p@example.com", tier: "premium", joined: "2026-05-14" },
  { name: "Liam Botha", email: "liam.b@example.com", tier: "free", joined: "2026-05-09" },
  { name: "Nadia Adams", email: "nadia.a@example.com", tier: "premium", joined: "2026-05-03" },
  { name: "Pieter van Wyk", email: "pieter.vw@example.com", tier: "free", joined: "2026-04-29" },
];

const joinedFmt = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" });

export function formatJoined(iso: string) {
  return joinedFmt.format(new Date(iso));
}
