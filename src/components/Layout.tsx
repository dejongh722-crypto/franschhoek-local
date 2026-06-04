import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { PromoPopup } from "./PromoPopup";

// Main browse pages where the persistent top-right profile icon is shown.
// Home has its own avatar button in the Hero; detail/sub pages have their own
// top bars (back button / actions), so they're excluded to avoid clashing.
const PROFILE_ICON_ROUTES = new Set([
  "/explore",
  "/venues",
  "/events",
  "/deals",
  "/community",
  "/knowledge",
]);

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Don't surface promo pop-ups while managing them in the admin area.
  const showPromo = pathname !== "/admin";
  const showProfile = PROFILE_ICON_ROUTES.has(pathname);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-sand">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Persistent profile access — top-right, aligned to the app's centered column. */}
      {showProfile && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto max-w-md">
          <button
            aria-label="Your profile"
            onClick={() => navigate("/profile")}
            className="pointer-events-auto absolute right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] grid h-9 w-9 place-items-center rounded-full bg-white/80 text-ink shadow-sm ring-1 ring-black/10 backdrop-blur transition-colors hover:bg-card"
          >
            <User className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      )}

      <BottomNav />
      {showPromo && <PromoPopup />}
    </div>
  );
}
