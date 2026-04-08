import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const POSTS_PER_PAGE = 9;

const Blog = () => {
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: allTags } = useQuery({
    queryKey: ["blog-tags-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_tags").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tagMap } = useQuery({
    queryKey: ["blog-post-tags-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_post_tags").select("post_id, blog_tags(name, slug)");
      if (error) throw error;
      const map: Record<string, { name: string; slug: string }[]> = {};
      for (const r of data ?? []) {
        const tag = (r as any).blog_tags;
        if (!tag) continue;
        if (!map[r.post_id]) map[r.post_id] = [];
        map[r.post_id].push(tag);
      }
      return map;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts-all", page],
    queryFn: async () => {
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      const { data, error, count } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, image_url, published_at", { count: "exact" })
        .order("published_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { posts: data, total: count ?? 0 };
    },
    staleTime: 1000 * 60 * 10,
  });

  const totalPages = data ? Math.ceil(data.total / POSTS_PER_PAGE) : 1;

  const filteredPosts = activeTag
    ? data?.posts.filter((p) => tagMap?.[p.id]?.some((t) => t.slug === activeTag))
    : data?.posts;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">Blog</h1>
        <p className="mb-6 text-muted-foreground">
          Latest posts about Microsoft Intune and endpoint management
        </p>

        {/* Tag filter */}
        {allTags && allTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!activeTag ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(activeTag === tag.slug ? null : tag.slug)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${activeTag === tag.slug ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredPosts && filteredPosts.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <h2 className="mb-2 font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="mb-3 flex-1 text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                  {tagMap?.[post.id] && tagMap[post.id].length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {tagMap[post.id].map((t) => (
                        <Badge key={t.slug} variant="secondary" className="text-[10px] px-1.5 py-0">{t.name}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground">
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.published_at).toLocaleDateString("sv-SE")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {!activeTag && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">No blog posts available right now.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
