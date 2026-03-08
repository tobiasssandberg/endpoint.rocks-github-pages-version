import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublicRows, withTimeout } from "@/lib/publicData";
import { Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface BlogSectionProps {
  searchQuery?: string;
  onResultCount?: (count: number) => void;
}

const BlogSection = ({ searchQuery = "", onResultCount }: BlogSectionProps) => {
  const isSearching = searchQuery.trim().length > 0;

  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const sdkPromise = supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, image_url, published_at")
          .order("published_at", { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return data ?? [];
          });

        let rows: any[];
        try {
          rows = await withTimeout(Promise.resolve(sdkPromise), 7000);
        } catch {
          rows = await fetchPublicRows<any>("blog_posts?select=id,title,slug,excerpt,image_url,published_at&order=published_at.desc");
        }

        if (active) setAllPosts(rows);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadPosts();
    return () => {
      active = false;
    };
  }, []);

  const posts = allPosts.filter((post) => {
    if (!isSearching) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isSearching) {
      onResultCount?.(posts.length);
    } else {
      onResultCount?.(0);
    }
  }, [posts.length, isSearching, onResultCount]);

  const displayPosts = isSearching ? posts : posts.slice(0, 3);

  return (
    <section id="blog" className="border-t border-border/50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold md:text-3xl">
          Latest from the Blog
          {isSearching && (
            <span className="ml-3 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
              {posts.length} {posts.length === 1 ? "result" : "results"}
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : errorMessage ? (
          <p className="text-muted-foreground">
            Kunde inte hämta blogginlägg just nu. Ladda om sidan och försök igen.
          </p>
        ) : displayPosts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="mb-2 font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
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
        ) : (
          <p className="text-muted-foreground">
            {isSearching ? "No blog posts match your search." : "No blog posts available right now."}
          </p>
        )}

        {!isSearching && posts.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all posts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
