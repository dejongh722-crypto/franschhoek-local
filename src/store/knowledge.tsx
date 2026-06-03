import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { knowledgePosts as seedPosts, type KnowledgePost } from "@/data/knowledge";
import { categoryImage } from "@/data/categories";

export type KnowledgeInput = Omit<KnowledgePost, "id">;

interface WriteResult {
  error?: string;
}

interface KnowledgeContextValue {
  posts: KnowledgePost[];
  getPostById: (id?: string) => KnowledgePost | undefined;
  addPost: (input: KnowledgeInput) => Promise<WriteResult>;
  updatePost: (id: string, patch: Partial<KnowledgeInput>) => Promise<WriteResult>;
  removePost: (id: string) => Promise<WriteResult>;
}

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

interface KnowledgeRow {
  id: string;
  title: string;
  excerpt: string | null;
  category_slug: string | null;
  author: string | null;
  published_at: string | null;
  read_minutes: number | null;
  image: string | null;
  body: string[] | null;
  tips: string[] | null;
}

function fromRow(r: KnowledgeRow): KnowledgePost {
  return {
    id: r.id,
    title: r.title,
    excerpt: r.excerpt ?? "",
    categorySlug: r.category_slug ?? "",
    author: r.author ?? "",
    publishedAt: r.published_at ?? "",
    readMinutes: r.read_minutes ?? 4,
    image: r.image || categoryImage(r.category_slug ?? "", r.id),
    body: r.body ?? [],
    tips: r.tips ?? [],
  };
}

function toRow(p: KnowledgePost) {
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    category_slug: p.categorySlug,
    author: p.author,
    published_at: p.publishedAt,
    read_minutes: p.readMinutes,
    image: p.image,
    body: p.body,
    tips: p.tips ?? [],
  };
}

const slugId = (title: string) =>
  `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "post"}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

const NOT_SAVED = "Couldn't save — your account needs admin access (profiles.is_admin = true).";

export function KnowledgeProvider({ children }: { children: ReactNode }) {
  const cloud = Boolean(supabase);
  const [posts, setPosts] = useState<KnowledgePost[]>(cloud ? [] : seedPosts);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("knowledge_posts").select("*").order("published_at", { ascending: false });
    if (error) {
      // Table not created yet — fall back to the bundled samples so the app still works.
      setPosts(seedPosts);
      return;
    }
    setPosts((data as KnowledgeRow[]).map(fromRow));
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    void fetchAll();
    const channel = sb
      .channel("knowledge-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "knowledge_posts" }, () => void fetchAll())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [fetchAll]);

  const addPost = useCallback(
    async (input: KnowledgeInput): Promise<WriteResult> => {
      const post: KnowledgePost = { ...input, id: slugId(input.title) };
      if (supabase) {
        const { data, error } = await supabase.from("knowledge_posts").insert(toRow(post)).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setPosts((prev) => [post, ...prev]);
      }
      return {};
    },
    [fetchAll],
  );

  const updatePost = useCallback(
    async (id: string, patch: Partial<KnowledgeInput>): Promise<WriteResult> => {
      if (supabase) {
        const current = posts.find((p) => p.id === id) as KnowledgePost;
        const { data, error } = await supabase.from("knowledge_posts").update(toRow({ ...current, ...patch, id })).eq("id", id).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      }
      return {};
    },
    [posts, fetchAll],
  );

  const removePost = useCallback(
    async (id: string): Promise<WriteResult> => {
      if (supabase) {
        const { data, error } = await supabase.from("knowledge_posts").delete().eq("id", id).select();
        if (error) return { error: error.message };
        if (!data || data.length === 0) return { error: NOT_SAVED };
        await fetchAll();
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
      return {};
    },
    [fetchAll],
  );

  const value = useMemo<KnowledgeContextValue>(
    () => ({
      posts,
      getPostById: (id) => posts.find((p) => p.id === id),
      addPost,
      updatePost,
      removePost,
    }),
    [posts, addPost, updatePost, removePost],
  );

  return <KnowledgeContext.Provider value={value}>{children}</KnowledgeContext.Provider>;
}

export function useKnowledge() {
  const ctx = useContext(KnowledgeContext);
  if (!ctx) throw new Error("useKnowledge must be used within a KnowledgeProvider");
  return ctx;
}
