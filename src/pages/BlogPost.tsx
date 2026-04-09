import { useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useCallback } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import CodeBlock from "@/components/CodeBlock";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

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

  const { data: tags } = useQuery({
    queryKey: ["blog-post-tags", post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_tags")
        .select("tag_id, blog_tags(name, slug)")
        .eq("post_id", post!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.blog_tags).filter(Boolean);
    },
    enabled: !!post?.id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!post) return;

    const ogUrl = `${window.location.origin}/blog/${post.slug}`;
    const metaTitle = post.meta_title || post.title;
    const metaDesc = post.meta_description || post.excerpt;
    const ogImage = post.og_image || post.image_url;

    document.title = `${metaTitle} | Endpoint.rocks`;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", metaDesc);
    setMeta("og:title", metaTitle, "property");
    setMeta("og:description", metaDesc, "property");
    setMeta("og:url", ogUrl, "property");
    setMeta("og:type", "article", "property");
    if (ogImage) setMeta("og:image", ogImage, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", metaTitle);
    setMeta("twitter:description", metaDesc);
    if (ogImage) setMeta("twitter:image", ogImage);

    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: metaTitle,
      description: metaDesc,
      url: ogUrl,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      ...(ogImage ? { image: ogImage } : {}),
      publisher: { "@type": "Organization", name: "Endpoint.rocks" },
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
            <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.published_at).toLocaleDateString("sv-SE")}
                </span>
              )}
              {tags?.map((tag: any) => (
                <Badge key={tag.slug} variant="secondary" className="text-xs">{tag.name}</Badge>
              ))}
            </div>
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="mb-8 w-full rounded-xl object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt || ""}
                        className="cursor-pointer transition-opacity hover:opacity-90 rounded-xl"
                        onClick={() => src && setLightboxSrc(src)}
                      />
                    ),
                    code: (props) => <CodeBlock {...props} />,
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            <ImageLightbox src={lightboxSrc} onClose={closeLightbox} />
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
