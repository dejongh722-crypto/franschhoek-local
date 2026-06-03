/**
 * Sample analytics for the admin dashboard. Deterministic placeholder data —
 * will be replaced with live figures from Supabase (users, subscriptions,
 * Yoco revenue) once the backend is connected.
 */

export interface MonthRevenue {
  label: string;
  amount: number; // ZAR
}

export const monthlyRevenue: MonthRevenue[] = [
  { label: "Nov", amount: 18400 },
  { label: "Dec", amount: 22100 },
  { label: "Jan", amount: 20950 },
  { label: "Feb", amount: 26800 },
  { label: "Mar", amount: 31200 },
  { label: "Apr", amount: 35600 },
  { label: "May", amount: 38900 },
  { label: "Jun", amount: 41250 },
];

export const analytics = {
  totalUsers: 1248,
  premiumMembers: 312,
  newUsersThisMonth: 86,
  /** One-off (non-subscription) revenue collected historically, in ZAR. */
  historicRevenueBase: 184500,
};

/** Format a ZAR amount with no decimals, e.g. "R41 250". */
export const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});
