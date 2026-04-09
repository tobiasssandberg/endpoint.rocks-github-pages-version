import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ImageLightbox from "@/components/ImageLightbox";

interface BlogPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    title: string;
    content: string;
    excerpt: string;
    image_url: string;
    published_at: string;
    tags?: string[];
  };
}

const BlogPreview = ({ open, onOpenChange, post }: BlogPreviewProps) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Preview</SheetTitle>
      </SheetHeader>
      <article className="mt-6 space-y-4">
        <h1 className="text-2xl font-bold md:text-3xl">{post.title || "Untitled"}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.published_at).toLocaleDateString("sv-SE")}
            </span>
          )}
          {post.tags?.map((t) => (
            <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t}</span>
          ))}
        </div>
        {post.image_url && (
          <img src={post.image_url} alt={post.title} className="w-full rounded-xl object-cover" />
        )}
        {post.content.trim().startsWith("<") ? (
          <div
            className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl [&_img]:cursor-pointer [&_img]:transition-opacity [&_img]:hover:opacity-90"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === "IMG") setLightboxSrc((target as HTMLImageElement).src);
            }}
          />
        ) : (
          <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt || ""}
                    className="cursor-pointer transition-opacity hover:opacity-90 rounded-xl"
                    onClick={() => src && setLightboxSrc(src)}
                  />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        )}
        <ImageLightbox src={lightboxSrc} onClose={closeLightbox} />
      </article>
    </SheetContent>
  </Sheet>
  );
};

export default BlogPreview;
