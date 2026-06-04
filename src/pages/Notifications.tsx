import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Tag, Bell, CheckCheck, type LucideIcon } from "lucide-react";
import { useNotifications, type NotificationKind } from "@/store/notifications";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationKind, LucideIcon> = {
  event: CalendarDays,
  deal: Tag,
  info: Bell,
};

const dateFmt = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" });

export function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isRead, markRead, markAllRead } = useNotifications();

  const open = (id: string, link?: string) => {
    markRead(id);
    if (link) navigate(link);
  };

  return (
    <div className="pb-6">
      <header className="bg-wine px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div className="flex items-center gap-3">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="flex-1 font-display text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs font-semibold text-white/85 transition-opacity hover:opacity-80"
            >
              <CheckCheck className="h-4 w-4" strokeWidth={2} />
              Mark all
            </button>
          )}
        </div>
      </header>

      <div className="px-5 py-5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-wine/10 text-wine">
              <Bell className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm text-muted">You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => {
              const Icon = ICONS[n.kind];
              const read = isRead(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => open(n.id, n.link)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl p-3.5 text-left ring-1 transition-colors",
                    read ? "bg-card ring-black/5" : "bg-wine/[0.04] ring-wine/15",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-wine/10 text-wine">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="flex-1 truncate font-semibold text-ink">{n.title}</h3>
                      <span className="shrink-0 text-[11px] text-muted">{dateFmt.format(new Date(n.at))}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>
                  </div>
                  {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cta" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
