import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { PromoPopup } from "./PromoPopup";

export function Layout() {
  const { pathname } = useLocation();
  // Don't surface promo pop-ups while managing them in the admin area.
  const showPromo = pathname !== "/admin";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-sand">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
      {showPromo && <PromoPopup />}
    </div>
  );
}
