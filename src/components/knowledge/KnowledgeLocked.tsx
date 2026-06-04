import { useNavigate } from "react-router-dom";
import { Lock, Crown, BookOpen, Sparkles, Tag } from "lucide-react";
import { KnowledgeCard } from "./KnowledgeCard";
import { knowledgePosts } from "@/data/knowledge";

const perks = [
  { icon: BookOpen, label: "Insider guides" },
  { icon: Tag, label: "Local deals" },
  { icon: Sparkles, label: "Premium events" },
];

export function KnowledgeLocked() {
  const navigate = useNavigate();

  return (
    <div className="relative px-5 py-6">
      {/* Blurred preview behind the gate */}
      <div className="pointer-events-none select-none space-y-3 opacity-60 blur-[3px]" aria-hidden>
        {knowledgePosts.slice(0, 3).map((post) => (
          <KnowledgeCard key={post.id} post={post} />
        ))}
      </div>

      {/* Gate overlay */}
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-sand/40 via-sand/80 to-sand px-5">
        <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl ring-1 ring-line">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-wine/10 text-wine">
            <Lock className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-cta">
            <Crown className="h-4 w-4" strokeWidth={2} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Premium</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">Unlock Local Knowledge</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Insider guides from people who live here — where the locals eat, when to taste, and the
            corners the guidebooks miss.
          </p>

          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {perks.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-wine/5 px-3 py-1.5 text-[11px] font-medium text-wine ring-1 ring-wine/10"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {label}
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate("/membership")}
            className="mt-5 w-full rounded-full bg-cta py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cta-hover active:scale-[0.99]"
          >
            Go Premium
          </button>
        </div>
      </div>
    </div>
  );
}
