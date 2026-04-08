import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";
import { Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

const BlogPreview = ({ open, onOpenChange, post }: BlogPreviewProps) => (
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
            className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        ) : (
          <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        )}
      </article>
    </SheetContent>
  </Sheet>
);

export default BlogPreview;
