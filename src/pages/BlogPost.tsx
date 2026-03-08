import { useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!post) return;

    const ogUrl = `${window.location.origin}/blog/${post.slug}`;

    document.title = `${post.title} | Endpoint.rocks`;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", post.excerpt);
    setMeta("og:title", post.title, "property");
    setMeta("og:description", post.excerpt, "property");
    setMeta("og:url", ogUrl, "property");
    setMeta("og:type", "article", "property");
    if (post.image_url) setMeta("og:image", post.image_url, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", post.title);
    setMeta("twitter:description", post.excerpt);
    if (post.image_url) setMeta("twitter:image", post.image_url);

    // JSON-LD structured data
    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      url: ogUrl,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      ...(post.image_url ? { image: post.image_url } : {}),
      publisher: {
        "@type": "Organization",
        name: "Endpoint.rocks",
      },
    });
    document.head.appendChild(jsonLd);

    return () => {
      document.title = "Endpoint.rocks";
      jsonLd.remove();
      ["description", "twitter:card", "twitter:title", "twitter:description", "twitter:image"].forEach((n) =>
        document.querySelector(`meta[name="${n}"]`)?.remove()
      );
      ["og:title", "og:description", "og:url", "og:type", "og:image"].forEach((n) =>
        document.querySelector(`meta[property="${n}"]`)?.remove()
      );
    };
  }, [post]);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <Link
          to="/#blog"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : post ? (
          <article className="mx-auto max-w-3xl animate-fade-in" style={{ animationDelay: "100ms", opacity: 0 }}>
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">{post.title}</h1>
            {post.published_at && (
              <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(post.published_at).toLocaleDateString("sv-SE")}
              </div>
            )}
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="mb-8 w-full rounded-xl object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div
              className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            />
          </article>
        ) : (
          <p className="text-muted-foreground">Post not found.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
