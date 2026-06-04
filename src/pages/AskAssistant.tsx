import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Bot } from "lucide-react";
import { ASSISTANT_WELCOME, SUGGESTED_QUESTIONS, getBotReply } from "@/data/assistant";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type ApiMessage = { role: "user" | "assistant"; content: string };

/** Call the assistant: Supabase Edge Function in production, local proxy in dev. */
async function callAssistant(messages: ApiMessage[]): Promise<string | undefined> {
  if (import.meta.env.PROD && supabase) {
    const { data, error } = await supabase.functions.invoke("ask", { body: { messages } });
    if (error) throw error;
    return (data as { reply?: string })?.reply;
  }
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("assistant_failed");
  return ((await res.json()) as { reply?: string }).reply;
}

interface Msg {
  id: string;
  role: "bot" | "me";
  body: string;
  at: string;
}

const timeFmt = new Intl.DateTimeFormat("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });

export function AskAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(() => [
    { id: "welcome", role: "bot", body: ASSISTANT_WELCOME, at: new Date().toISOString() },
  ]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const addBot = (body: string) =>
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", body, at: new Date().toISOString() }]);

  const ask = async (text?: string) => {
    const value = (text ?? draft).trim();
    if (!value || isTyping) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "me", body: value, at: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft("");
    setIsTyping(true);

    // Conversation history for the model (drop the welcome turn; map roles).
    const apiMessages: ApiMessage[] = next
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role === "me" ? "user" : "assistant", content: m.body }));

    try {
      const reply = await callAssistant(apiMessages);
      addBot(reply?.trim() || getBotReply(value));
    } catch {
      // Backend unavailable — fall back to the offline FAQ matcher.
      addBot(getBotReply(value));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col bg-sand">
      {/* Header */}
      <header className="flex items-center gap-3 bg-gradient-to-br from-wine via-wine to-wine-deep px-3 py-2.5 pt-[calc(env(safe-area-inset-top)+0.6rem)] text-white">
        <button
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 ring-2 ring-white/25">
          <Bot className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">Franschhoek Local Assistant</h1>
          <p className="flex items-center gap-1.5 text-[11px] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cat-adventure" />
            Online · replies instantly
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.role === "me";
          return (
            <div key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
              {!mine && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wine text-white">
                  <Bot className="h-4 w-4" strokeWidth={2} />
                </span>
              )}
              <div className={cn("max-w-[80%]", mine && "text-right")}>
                <div
                  className={cn(
                    "whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    mine
                      ? "rounded-br-md bg-wine text-white"
                      : "rounded-bl-md bg-card text-ink shadow-sm ring-1 ring-line",
                  )}
                >
                  {m.body}
                </div>
                <span className="mx-1 mt-0.5 block text-[10px] text-muted">{timeFmt.format(new Date(m.at))}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wine text-white">
              <Bot className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-3 shadow-sm ring-1 ring-line">
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
      </div>

      {/* Suggested questions */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-1">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-wine/40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
        className="flex items-center gap-2 border-t border-line bg-card px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.6rem)]"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
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
  );
}
