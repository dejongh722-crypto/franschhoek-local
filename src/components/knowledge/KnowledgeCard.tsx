import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { formatPublished, type KnowledgePost } from "@/data/knowledge";

/** Magazine-style article card for the knowledge list. */
export function KnowledgeCard({ post }: { post: KnowledgePost }) {
  const navigate = useNavigate();
  const cat = categoryBySlug[post.categorySlug];

  return (
    <article
      onClick={() => navigate(`/knowledge/${post.id}`)}
      className="group flex cursor-pointer gap-3 overflow-hidden rounded-2xl bg-card p-2.5 shadow-sm ring-1 ring-line transition-transform active:scale-[0.99]"
    >
      <img
        src={post.image}
        alt={post.title}
        className="h-24 w-24 shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center pr-1">
        {cat && (
          <span className="text-[11px] font-semibold" style={{ color: cat.color }}>
            {cat.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-ink">
          {post.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {post.readMinutes} min read
          </span>
          <span className="h-1 w-1 rounded-full bg-muted/40" />
          <span className="truncate">{formatPublished(post.publishedAt)}</span>
        </div>
      </div>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 self-center text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-wine"
        strokeWidth={2}
      />
    </article>
  );
}
