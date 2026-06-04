import { useNavigate } from "react-router-dom";
import { ChevronRight, Users, CalendarPlus, MessageCircle, Bot, MessagesSquare } from "lucide-react";
import { formatChatTime, GENERAL_ID, ONLINE_COUNT } from "@/data/chat";
import { categoryBySlug } from "@/data/categories";
import { useEvents } from "@/store/events";
import { useUserEvents } from "@/store/userEvents";
import { useChat } from "@/store/chat";
import { useCommunityGroups, type CommunityGroup } from "@/store/communityGroups";

export function Community() {
  const navigate = useNavigate();
  const { events } = useEvents();
  const { attendingIds } = useUserEvents();
  const { getLastMessage } = useChat();
  const { activeGroups } = useCommunityGroups();

  // Only events that have a chat AND that you're attending.
  const myChats = events.filter((e) => e.hasChat && attendingIds.has(e.id));
  const generalLast = getLastMessage(GENERAL_ID);

  return (
    <div className="pb-6">
      <header className="bg-wine px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-white">
        <h1 className="font-display text-3xl font-semibold">Community</h1>
        <p className="mt-1 text-sm text-white/75">Chat with members and event attendees</p>
      </header>

      {/* Public WhatsApp groups — open to everyone (free discovery). */}
      {activeGroups.length > 0 && (
        <section className="px-5 pt-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Local WhatsApp groups</h2>
          <div className="space-y-3">
            {activeGroups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}

      <div className="space-y-7 px-5 py-5">
          {/* Open to everyone (free): general room + help assistant */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Open to all members</h2>
            <button
              onClick={() => navigate(`/community/${GENERAL_ID}`)}
              className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-wine to-wine-deep p-4 text-left text-white shadow-sm transition-transform active:scale-[0.99]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Users className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">General Community</h3>
                <p className="truncate text-xs text-white/75">
                  {generalLast ? generalLast.body : "Ask anything and meet fellow members"}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-cat-adventure" />
                  {ONLINE_COUNT} online now
                </span>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/70" strokeWidth={2} />
            </button>

            {/* Ask a question — help assistant */}
            <button
              onClick={() => navigate("/community/ask")}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-line transition-transform active:scale-[0.99]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-wine/10 text-wine">
                <Bot className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">Ask a Question</h3>
                  <span className="rounded-full bg-cta/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cta">
                    Assistant
                  </span>
                </div>
                <p className="truncate text-xs text-muted">Get instant answers about the app</p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-cat-adventure" />
                  Online · replies instantly
                </span>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted" strokeWidth={2} />
            </button>
          </section>

          {/* Event chats — free, for events you're attending */}
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Your event chats</h2>
            {myChats.length > 0 ? (
              <div className="space-y-3">
                {myChats.map((event) => {
                  const last = getLastMessage(event.id, event.venue);
                  return (
                    <button
                      key={event.id}
                      onClick={() => navigate(`/community/${event.id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm ring-1 ring-line transition-transform active:scale-[0.99]"
                    >
                      <img src={event.image} alt={event.title} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate font-semibold text-ink">{event.title}</h3>
                          {last && <span className="shrink-0 text-[11px] text-muted">{formatChatTime(last.at)}</span>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {last ? `${last.authorName.split(" ")[0]}: ${last.body}` : "No messages yet"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <Steps onBrowse={() => navigate("/events")} />
            )}
          </section>
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: CommunityGroup }) {
  const cat = categoryBySlug[group.categorySlug];
  return (
    <a
      href={group.inviteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm ring-1 ring-line transition-transform active:scale-[0.99]"
    >
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
        style={{ backgroundColor: cat?.color ?? "var(--color-cat-adventure)" }}
      >
        <MessagesSquare className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        {cat && (
          <span className="text-[11px] font-semibold" style={{ color: cat.color }}>
            {cat.name}
          </span>
        )}
        <h3 className="truncate font-semibold text-ink">{group.name}</h3>
        {group.description && <p className="truncate text-xs text-muted">{group.description}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-cat-adventure px-3 py-1.5 text-xs font-semibold text-white">
        Join
      </span>
    </a>
  );
}

/** Simple, friendly explanation of how event chats appear. */
function Steps({ onBrowse }: { onBrowse: () => void }) {
  const steps = [
    { n: "1", text: "Find an event with a chat", hint: "Look for the chat label on the event." },
    { n: "2", text: "Sign up to attend", hint: "Tap “Sign up to attend” on the event." },
    { n: "3", text: "Its chat appears here", hint: "Open it and start chatting." },
  ];
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-line">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-wine" strokeWidth={1.75} />
        <h3 className="font-semibold text-ink">How event chats work</h3>
      </div>
      <ol className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-wine text-xs font-bold text-white">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{s.text}</p>
              <p className="text-xs text-muted">{s.hint}</p>
            </div>
          </li>
        ))}
      </ol>
      <button
        onClick={onBrowse}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-wine py-3 text-sm font-semibold text-white transition-colors hover:bg-wine-soft"
      >
        <CalendarPlus className="h-4 w-4" strokeWidth={2} />
        Browse events
      </button>
    </div>
  );
}
