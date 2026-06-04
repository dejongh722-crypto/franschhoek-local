import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  ShieldCheck,
  Heart,
  CalendarCheck,
  MessagesSquare,
  ChevronRight,
  Bell,
  Settings as SettingsIcon,
  HelpCircle,
  Info,
  LogOut,
  Pencil,
  Check,
  X,
  Camera,
  LayoutDashboard,
  LogIn,
  Shield,
} from "lucide-react";
import { ADMIN_ENABLED } from "@/config";
import { useAuth } from "@/store/auth";
import { EventRow } from "@/components/home/EventRow";
import { type AppEvent } from "@/data/events";
import { initials } from "@/data/chat";
import { useEvents } from "@/store/events";
import { useMembership } from "@/store/membership";
import { useUserEvents } from "@/store/userEvents";
import { useProfile } from "@/store/profile";
import { useToast } from "@/store/toast";
import { fileToAvatar } from "@/lib/image";
import { localNotify, requestNotificationPermission } from "@/lib/notify";
import { cn } from "@/lib/utils";

const EMAIL = "dejongh722@gmail.com"; // placeholder until auth

export function Profile() {
  const navigate = useNavigate();
  const { isPremium, plan } = useMembership();
  const { getEventById } = useEvents();
  const { savedIds, attendingIds } = useUserEvents();
  const { name, notifications, avatar, setName, toggleNotifications, setAvatar } = useProfile();
  const { user, signOut: authSignOut, updateProfile, isAdmin } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const email = user?.email ?? EMAIL;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await fileToAvatar(file);
      setAvatar(dataUrl);
      if (user) void updateProfile({ avatar_url: dataUrl });
      toast("Photo updated");
    } catch {
      toast("Couldn't load that image");
    }
  };

  const handleNotifications = async () => {
    const turningOn = !notifications;
    toggleNotifications();
    if (turningOn) {
      const granted = await requestNotificationPermission();
      if (granted) {
        localNotify("Notifications enabled", "We'll let you know about events and deals.");
        toast("Notifications on");
      } else {
        toast("Allow notifications in your browser to receive them");
      }
    } else {
      toast("Notifications off");
    }
  };

  const byIds = (ids: Set<string>) =>
    [...ids].map(getEventById).filter((e): e is AppEvent => Boolean(e));
  const savedEvents = byIds(savedIds);
  const attendingEvents = byIds(attendingIds);
  const chatsCount = attendingEvents.filter((e) => e.hasChat).length;

  const saveName = () => {
    const next = draft.trim() || "Guest";
    setName(next);
    if (user) void updateProfile({ full_name: next });
    setEditing(false);
    toast("Profile updated");
  };

  const signOut = async () => {
    if (!window.confirm("Sign out of your account?")) return;
    await authSignOut();
    toast("Signed out");
    navigate("/");
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-wine via-wine to-wine-deep px-5 pb-12 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-center text-white">
        <div className="pointer-events-none absolute -right-12 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        {!editing && (
          <button
            aria-label="Edit profile"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
            className="absolute right-4 top-[calc(env(safe-area-inset-top)+1.4rem)] grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition-colors hover:bg-white/25"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
        )}

        <div className="relative">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile photo"
            className="relative mx-auto block h-20 w-20"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover shadow-md ring-4 ring-white/20"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-full bg-card font-display text-2xl font-semibold text-wine shadow-md ring-4 ring-white/20">
                {initials(name)}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 grid h-7 w-7 place-items-center rounded-full bg-cta text-white ring-2 ring-wine">
              <Camera className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </button>
        </div>
        <div className="relative">

          {editing ? (
            <div className="mx-auto mt-4 flex max-w-[16rem] items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                maxLength={24}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="min-w-0 flex-1 rounded-full bg-white/15 px-4 py-2 text-center text-sm text-white outline-none ring-1 ring-white/30 placeholder:text-white/60"
                placeholder="Your name"
              />
              <button
                aria-label="Save name"
                onClick={saveName}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cta text-white"
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                aria-label="Cancel"
                onClick={() => setEditing(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/25"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <h1 className="mt-3 font-display text-2xl font-semibold">{name}</h1>
          )}
          <p className="text-sm text-white/70">{email}</p>

          <span
            className={
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide " +
              (isPremium ? "bg-cta text-white" : "bg-white/15 text-white ring-1 ring-white/25")
            }
          >
            <Crown className="h-3.5 w-3.5" strokeWidth={2.5} />
            {isPremium ? "Premium member" : "Free member"}
          </span>
        </div>
      </header>

      <div className="px-5">
        {/* Stats */}
        <div className="relative z-10 -mt-6 grid grid-cols-3 divide-x divide-line rounded-2xl bg-card py-4 shadow-sm ring-1 ring-black/5">
          <Stat icon={Heart} value={savedEvents.length} label="Saved" />
          <Stat icon={CalendarCheck} value={attendingEvents.length} label="Attending" />
          <Stat icon={MessagesSquare} value={chatsCount} label="Chats" />
        </div>

        {/* Membership */}
        <section className="mt-6">
          {isPremium ? (
            <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cat-adventure/10 text-cat-adventure">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-ink">Premium member</h3>
                <p className="text-xs text-muted">
                  {plan ? `${plan === "annual" ? "Annual" : "Monthly"} plan · ` : ""}Full access unlocked
                </p>
              </div>
              <button
                onClick={() => navigate("/membership")}
                className="shrink-0 rounded-full bg-wine px-4 py-2 text-xs font-semibold text-white"
              >
                Manage
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/membership")}
              className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-wine to-wine-deep p-4 text-left text-white shadow-sm"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cta/20 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Crown className="h-6 w-6 text-cta" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">Upgrade to Premium</h3>
                  <p className="text-xs text-white/75">Deals, premium events & community chat.</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-white/70" strokeWidth={2} />
              </div>
            </button>
          )}
        </section>

        {/* Saved */}
        <ListSection
          title="Saved"
          count={savedEvents.length}
          emptyIcon={Heart}
          emptyText="Tap the heart on an event to save it here."
        >
          {savedEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ListSection>

        {/* Attending */}
        <ListSection
          title="Attending"
          count={attendingEvents.length}
          emptyIcon={CalendarCheck}
          emptyText="Events you RSVP to will appear here."
        >
          {attendingEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ListSection>

        {/* Settings */}
        <section className="mt-7">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Settings</h2>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
            <SettingRow
              icon={Bell}
              label="Notifications"
              onClick={handleNotifications}
              control={<Switch on={notifications} />}
            />
            <SettingRow
              icon={SettingsIcon}
              label="Account & preferences"
              onClick={() => toast("Account settings are coming soon")}
            />
            <SettingRow
              icon={HelpCircle}
              label="Help & support"
              onClick={() => navigate("/community/ask")}
            />
            <SettingRow icon={Shield} label="Privacy policy" onClick={() => navigate("/privacy")} />
            <SettingRow
              icon={Info}
              label="About Franschhoek Local"
              onClick={() => toast("Franschhoek Local v0.1 — your guide to the valley")}
            />
            {(ADMIN_ENABLED || isAdmin) && (
              <SettingRow icon={LayoutDashboard} label="Admin dashboard" onClick={() => navigate("/admin")} />
            )}
            {user ? (
              <SettingRow icon={LogOut} label="Sign out" danger last onClick={signOut} />
            ) : (
              <SettingRow icon={LogIn} label="Sign in / Create account" last onClick={() => navigate("/signin")} />
            )}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted">Franschhoek Local · v0.1</p>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Heart; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <Icon className="h-5 w-5 text-wine" strokeWidth={1.75} />
      <span className="mt-1 font-display text-xl font-semibold text-ink">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
        on ? "bg-cat-adventure" : "bg-line",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-all",
          on ? "left-[1.125rem]" : "left-0.5",
        )}
      />
    </span>
  );
}

function ListSection({
  title,
  count,
  emptyIcon: EmptyIcon,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  emptyIcon: typeof Heart;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
        {count > 0 && <span className="text-xs font-medium text-muted">{count}</span>}
      </div>
      {count > 0 ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-white/50 px-4 py-5 text-sm text-muted">
          <EmptyIcon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
          {emptyText}
        </div>
      )}
    </section>
  );
}

function SettingRow({
  icon: Icon,
  label,
  danger,
  last,
  onClick,
  control,
}: {
  icon: typeof Bell;
  label: string;
  danger?: boolean;
  last?: boolean;
  onClick?: () => void;
  control?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02] " +
        (last ? "" : "border-b border-line")
      }
    >
      <Icon className={"h-5 w-5 shrink-0 " + (danger ? "text-red-500" : "text-wine")} strokeWidth={1.75} />
      <span className={"flex-1 text-sm font-medium " + (danger ? "text-red-500" : "text-ink")}>{label}</span>
      {control ?? (!danger && <ChevronRight className="h-4 w-4 text-muted" strokeWidth={2} />)}
    </button>
  );
}
