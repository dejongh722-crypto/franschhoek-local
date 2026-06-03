import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Lock,
  Crown,
  CalendarCheck,
  Pin,
  Reply,
  BadgeCheck,
  CheckCheck,
  Smile,
  X,
  MessagesSquare,
} from "lucide-react";
import { useEvents } from "@/store/events";
import {
  formatChatTime,
  initials,
  ME,
  REACTION_EMOJIS,
  QUICK_REPLIES,
  ATTENDEES,
  GOING_COUNT,
  ONLINE_COUNT,
  GENERAL_ID,
  GENERAL_HOST,
  type ChatMessage,
} from "@/data/chat";

const GENERAL_IMAGE =
  "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=200&q=70";
import { useMembership } from "@/store/membership";
import { useUserEvents } from "@/store/userEvents";
import { useChat } from "@/store/chat";
import { useAuth } from "@/store/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function ChatThread() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isGeneral = eventId === GENERAL_ID;
  const { getEventById } = useEvents();
  const event = isGeneral ? undefined : getEventById(eventId);
  const { isPremium } = useMembership();
  const { isAttending, toggleAttending } = useUserEvents();
  const { getMessages, send, toggleReaction, pushAttendeeReply, openRoom } = useChat();
  const { user } = useAuth();
  const myId = user?.id ?? ME.id;

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  const threadId = isGeneral ? GENERAL_ID : (event?.id ?? "");
  const title = isGeneral ? "General Community" : event?.title;
  const image = isGeneral ? GENERAL_IMAGE : event?.image;
  const hostName = isGeneral ? GENERAL_HOST : event?.venue;
  const hasChat = isGeneral || !!event?.hasChat;
  const attending = event ? isAttending(event.id) : false;
  const canChat = isPremium && hasChat && (isGeneral || attending);
  const messages = canChat && threadId ? getMessages(threadId, hostName) : [];
  const byId = new Map(messages.map((m) => [m.id, m]));
  const pinned = messages.find((m) => m.pinned);
  const visible = messages.filter((m) => !m.pinned);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  // Subscribe to live messages for this room (cloud mode).
  useEffect(() => {
    if (!canChat || !threadId) return;
    return openRoom(threadId);
  }, [canChat, threadId, openRoom]);

  if (!isGeneral && !event) {
    return (
      <div className="mx-auto flex h-[100dvh] max-w-md flex-col items-center justify-center bg-sand px-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Event not found</h1>
        <p className="mt-2 text-sm text-muted">This chat is no longer available.</p>
        <button
          onClick={() => navigate("/community")}
          className="mt-6 rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to community
        </button>
      </div>
    );
  }

  const triggerSimReply = () => {
    timers.current.push(
      window.setTimeout(() => setIsTyping(true), 700),
      window.setTimeout(() => {
        setIsTyping(false);
        pushAttendeeReply(threadId);
      }, 2300),
    );
  };

  const submit = (text?: string) => {
    const value = (text ?? draft).trim();
    if (!value) return;
    send(threadId, value, replyTo?.id);
    setDraft("");
    setReplyTo(null);
    setActiveMsgId(null);
    if (!isSupabaseConfigured) triggerSimReply(); // simulate replies only without a real backend
  };

  const startReply = (m: ChatMessage) => {
    setReplyTo(m);
    setActiveMsgId(null);
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col bg-sand">
      {/* Header */}
      <header className="bg-gradient-to-br from-wine via-wine to-wine-deep px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.6rem)] text-white">
        <div className="flex items-center gap-3">
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/30" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            <p className="flex items-center gap-1.5 text-[11px] text-white/70">
              <Crown className="h-3 w-3 text-cta" strokeWidth={2.5} />
              Premium chat
            </p>
          </div>
        </div>

        {/* Attendee presence */}
        {canChat && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {ATTENDEES.slice(0, 4).map((a) => (
                <span
                  key={a.name}
                  className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-wine"
                  style={{ backgroundColor: a.color }}
                >
                  {initials(a.name)}
                </span>
              ))}
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-[10px] font-bold text-white ring-2 ring-wine">
                +{GOING_COUNT - 4}
              </span>
            </div>
            <span className="text-[11px] text-white/80">
              {GOING_COUNT} {isGeneral ? "members" : "going"}
            </span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-cat-adventure" />
              {ONLINE_COUNT} online
            </span>
          </div>
        )}
      </header>

      {!isPremium ? (
        <Blocked
          icon={Lock}
          title="Premium members only"
          subtitle="Upgrade to Premium to join event community chats."
          actionLabel="Go Premium"
          accent
          onAction={() => navigate("/membership")}
        />
      ) : !hasChat ? (
        <Blocked
          icon={MessagesSquare}
          title="No community chat"
          subtitle="This event doesn't have a community chat. Try the General Community room or another event."
          actionLabel="Back to community"
          onAction={() => navigate("/community")}
        />
      ) : !isGeneral && !attending ? (
        <Blocked
          icon={CalendarCheck}
          title="RSVP to join"
          subtitle="Sign up to attend this event and you'll be able to chat with other attendees."
          actionLabel="Sign up to attend"
          onAction={() => event && toggleAttending(event.id)}
        />
      ) : (
        <>
          {/* Pinned host announcement */}
          {pinned && (
            <div className="flex items-start gap-2 border-b border-line bg-cta/10 px-4 py-2.5">
              <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cta" strokeWidth={2.5} />
              <div className="min-w-0">
                <span className="flex items-center gap-1 text-[11px] font-bold text-wine">
                  {pinned.authorName}
                  <BadgeCheck className="h-3.5 w-3.5 text-cta" strokeWidth={2.5} />
                </span>
                <p className="line-clamp-2 text-xs leading-relaxed text-ink/80">{pinned.body}</p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="relative flex-1 space-y-1 overflow-y-auto px-4 py-4">
            <p className="mx-auto mb-2 w-fit rounded-full bg-black/5 px-3 py-1 text-[11px] text-muted">Today</p>

            {visible.map((m, i) => {
              const mine = m.authorId === myId;
              const isHost = m.role === "host";
              const prev = visible[i - 1];
              const grouped = prev && prev.authorId === m.authorId && !prev.pinned;
              const replied = m.replyToId ? byId.get(m.replyToId) : undefined;
              const active = activeMsgId === m.id;

              return (
                <div key={m.id} className={cn("flex items-end gap-2 pt-1", mine && "flex-row-reverse")}>
                  {/* Avatar (only at start of a group, others only) */}
                  {!mine ? (
                    grouped ? (
                      <span className="w-8 shrink-0" />
                    ) : (
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                        style={{ backgroundColor: m.authorColor }}
                      >
                        {initials(m.authorName)}
                      </span>
                    )
                  ) : null}

                  <div className={cn("relative max-w-[76%]", mine && "text-right")}>
                    {!mine && !grouped && (
                      <span className="ml-1 flex items-center gap-1 text-[11px] font-semibold" style={{ color: m.authorColor }}>
                        {m.authorName}
                        {isHost && <BadgeCheck className="h-3 w-3 text-cta" strokeWidth={2.5} />}
                      </span>
                    )}

                    {/* Reaction / reply action bar */}
                    {active && (
                      <div
                        className={cn(
                          "absolute -top-11 z-20 flex animate-popin items-center gap-0.5 rounded-full bg-white p-1 shadow-lg ring-1 ring-black/10",
                          mine ? "right-0" : "left-0",
                        )}
                      >
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              toggleReaction(m.id, emoji, m.reactions);
                              setActiveMsgId(null);
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full text-lg transition-transform hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                        <span className="mx-0.5 h-5 w-px bg-line" />
                        <button
                          onClick={() => startReply(m)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-black/5"
                          aria-label="Reply"
                        >
                          <Reply className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setActiveMsgId(active ? null : m.id)}
                      className={cn(
                        "mt-0.5 block w-full rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed",
                        mine
                          ? "rounded-br-md bg-wine text-white"
                          : isHost
                            ? "rounded-bl-md bg-cta/10 text-ink ring-1 ring-cta/30"
                            : "rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-black/5",
                      )}
                    >
                      {/* Quoted reply */}
                      {replied && (
                        <span
                          className={cn(
                            "mb-1 block rounded-lg border-l-2 px-2 py-1 text-left text-xs",
                            mine ? "border-white/50 bg-white/15 text-white/90" : "border-wine/40 bg-black/5 text-muted",
                          )}
                        >
                          <span className="font-semibold">{replied.authorName}</span>
                          <span className="line-clamp-1">{replied.body}</span>
                        </span>
                      )}
                      {m.body}
                    </button>

                    {/* Footer: time + read receipt */}
                    <span className={cn("mx-1 mt-0.5 flex items-center gap-1 text-[10px] text-muted", mine && "justify-end")}>
                      {formatChatTime(m.at)}
                      {mine && <CheckCheck className="h-3 w-3 text-cat-hotels" strokeWidth={2.5} />}
                    </span>

                    {/* Reactions */}
                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                      <div className={cn("mt-1 flex flex-wrap gap-1", mine && "justify-end")}>
                        {Object.entries(m.reactions).map(([emoji, users]) => {
                          const reacted = users.includes(ME.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(m.id, emoji, m.reactions)}
                              className={cn(
                                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 transition-colors",
                                reacted ? "bg-wine/10 text-wine ring-wine/30" : "bg-white text-muted ring-black/5",
                              )}
                            >
                              <span>{emoji}</span>
                              {users.length}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2 pt-1">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: ATTENDEES[0].color }}
                >
                  {initials(ATTENDEES[0].name)}
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                  {[0, 0.2, 0.4].map((d) => (
                    <span
                      key={d}
                      className="typing-dot h-1.5 w-1.5 rounded-full bg-muted"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />

            {/* Tap-away backdrop for the action bar */}
            {activeMsgId && <div className="fixed inset-0 z-10" onClick={() => setActiveMsgId(null)} />}
          </div>

          {/* Quick replies */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-1">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-wine/40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-line bg-white px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.6rem)]">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-sand px-3 py-2">
                <Reply className="h-3.5 w-3.5 shrink-0 text-wine" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-wine">Replying to {replyTo.authorName}</span>
                  <p className="line-clamp-1 text-xs text-muted">{replyTo.body}</p>
                </div>
                <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-muted hover:text-ink">
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                aria-label="Add emoji"
                onClick={() => setDraft((d) => d + "🙂")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-black/5"
              >
                <Smile className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message…"
                className="flex-1 rounded-full bg-sand px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-line placeholder:text-muted focus:ring-wine/40"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-wine text-white transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function Blocked({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  accent,
}: {
  icon: typeof Lock;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-sand px-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-wine/10 text-wine">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </span>
      {accent && (
        <div className="mt-4 flex items-center gap-1.5 text-cta">
          <Crown className="h-4 w-4" strokeWidth={2} />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Premium</span>
        </div>
      )}
      <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{subtitle}</p>
      <button
        onClick={onAction}
        className={cn(
          "mt-5 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors",
          accent ? "bg-cta hover:bg-cta-hover" : "bg-wine hover:bg-wine-soft",
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}
