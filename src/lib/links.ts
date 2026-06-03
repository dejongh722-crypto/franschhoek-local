import type { NavigateFunction } from "react-router-dom";

/**
 * Follow a promotion's link, sending the user to exactly where it points:
 *  - full URLs (https://…) and mailto:/tel: open externally
 *  - bare domains (winery.co.za, www.foo.com/page) are treated as external https
 *  - in-app paths (/deals/abc) navigate within the app
 */
export function followLink(link: string | undefined, navigate: NavigateFunction): void {
  const target = link?.trim();
  if (!target) return;

  // Explicit external protocols.
  if (/^(https?:\/\/|mailto:|tel:)/i.test(target)) {
    if (/^(mailto:|tel:)/i.test(target)) window.location.href = target;
    else window.open(target, "_blank", "noopener,noreferrer");
    return;
  }

  // In-app route.
  if (target.startsWith("/")) {
    navigate(target);
    return;
  }

  // Bare domain like "winery.co.za" or "www.foo.com/specials" — open as external https.
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(target)) {
    window.open(`https://${target}`, "_blank", "noopener,noreferrer");
    return;
  }

  // Anything else: treat as an in-app path.
  navigate(`/${target}`);
}
