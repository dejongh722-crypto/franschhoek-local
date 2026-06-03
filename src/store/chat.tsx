import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTO_REPLIES,
  ME,
  seedMessages,
  type ChatMessage,
  type Reactions,
} from "@/data/chat";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useProfile } from "@/store/profile";

const STORAGE_KEY = "fl.chat.v2";
const cloud = Boolean(supabase);

/** Map of room -> user/attendee messages (local mode); seeds added at read time. */
type MessageMap = Record<string, ChatMessage[]>;
/** Reaction overlay keyed by messageId (applies to seed messages too). */
type ReactionMap = Record<string, Reactions>;

interface Persisted {
  messages: MessageMap;
  reactions: ReactionMap;
}

interface ChatContextValue {
  getMessages: (room: string, hostName?: string) => ChatMessage[];
  getLastMessage: (room: string, hostName?: string) => ChatMessage | undefined;
  send: (room: string, body: string, replyToId?: string) => void;
  toggleReaction: (messageId: string, emoji: string, base: Reactions | undefined) => void;
  pushAttendeeReply: (room: string) => void;
  /** Subscribe a room to live messages (cloud mode). Returns a cleanup fn. */
  openRoom: (room: string) => (() => void) | void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const attendeePool = [
  { id: "thandi", name: "Thandi M.", color: "#c2410c" },
  { id: "james", name: "James K.", color: "#3c7a8c" },
  { id: "sophie", name: "Sophie R.", color: "#7c5cbf" },
];

const PALETTE = ["#c2410c", "#3c7a8c", "#7c5cbf", "#3c8c5a", "#b07a3c", "#9c4452"];
function colorFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

interface MessageRow {
  id: string;
  room: string;
  author_id: string | null;
  author_name: string | null;
  body: string;
  created_at: string;
}
function fromMsgRow(r: MessageRow): ChatMessage {
  return {
    id: r.id,
    authorId: r.author_id ?? "unknown",
    authorName: r.author_name ?? "Member",
    authorColor: colorFor(r.author_id ?? r.id),
    body: r.body,
    at: r.created_at,
    role: "member",
  };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    /* ignore */
  }
  return { messages: {}, reactions: {} };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { name: myName } = useProfile();
  const [state, setState] = useState<Persisted>(load);
  const [roomMessages, setRoomMessages] = useState<MessageMap>({});

  // Persist local messages + reactions (reactions persist in both modes).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const openRoom = useCallback((room: string) => {
    const sb = supabase;
    if (!sb) return;
    let cancelled = false;

    void sb
      .from("messages")
      .select("*")
      .eq("room", room)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setRoomMessages((prev) => ({ ...prev, [room]: (data as MessageRow[]).map(fromMsgRow) }));
      });

    const channel = sb
      .channel(`messages-${room}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room=eq.${room}` },
        (payload) => {
          const msg = fromMsgRow(payload.new as MessageRow);
          setRoomMessages((prev) => {
            const list = prev[room] ?? [];
            if (list.some((m) => m.id === msg.id)) return prev;
            return { ...prev, [room]: [...list, msg] };
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void sb.removeChannel(channel);
    };
  }, []);

  const getMessages = useCallback(
    (room: string, hostName?: string) => {
      const live = cloud ? (roomMessages[room] ?? []) : (state.messages[room] ?? []);
      return [...seedMessages(room, hostName), ...live]
        .map((m) => ({ ...m, reactions: state.reactions[m.id] ?? m.reactions }))
        .sort((a, b) => a.at.localeCompare(b.at));
    },
    [state, roomMessages],
  );

  const getLastMessage = useCallback(
    (room: string, hostName?: string) => {
      const all = getMessages(room, hostName);
      return all[all.length - 1];
    },
    [getMessages],
  );

  const send = useCallback(
    (room: string, body: string, replyToId?: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;

      if (cloud && supabase && user) {
        void supabase.from("messages").insert({
          room,
          author_id: user.id,
          author_name: myName,
          body: trimmed,
        });
        return;
      }

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        authorId: ME.id,
        authorName: ME.name,
        authorColor: ME.color,
        role: "member",
        body: trimmed,
        at: new Date().toISOString(),
        ...(replyToId ? { replyToId } : {}),
      };
      setState((prev) => ({
        ...prev,
        messages: { ...prev.messages, [room]: [...(prev.messages[room] ?? []), message] },
      }));
    },
    [user, myName],
  );

  const pushAttendeeReply = useCallback((room: string) => {
    if (cloud) return; // real members reply in cloud mode
    setState((prev) => {
      const existing = prev.messages[room] ?? [];
      const author = attendeePool[existing.length % attendeePool.length];
      const body = AUTO_REPLIES[existing.length % AUTO_REPLIES.length];
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        authorId: author.id,
        authorName: author.name,
        authorColor: author.color,
        role: "member",
        body,
        at: new Date().toISOString(),
      };
      return { ...prev, messages: { ...prev.messages, [room]: [...existing, message] } };
    });
  }, []);

  const toggleReaction = useCallback((messageId: string, emoji: string, base: Reactions | undefined) => {
    setState((prev) => {
      const current = prev.reactions[messageId] ?? base ?? {};
      const users = new Set(current[emoji] ?? []);
      if (users.has(ME.id)) users.delete(ME.id);
      else users.add(ME.id);

      const nextEntry: Reactions = { ...current };
      if (users.size) nextEntry[emoji] = [...users];
      else delete nextEntry[emoji];

      return { ...prev, reactions: { ...prev.reactions, [messageId]: nextEntry } };
    });
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({ getMessages, getLastMessage, send, toggleReaction, pushAttendeeReply, openRoom }),
    [getMessages, getLastMessage, send, toggleReaction, pushAttendeeReply, openRoom],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
