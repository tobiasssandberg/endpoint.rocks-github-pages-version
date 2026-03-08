import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isSafeUrl } from "@/lib/urlValidation";
import { useQueryClient } from "@tanstack/react-query";

const JsonImportButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      let blogCount = 0;
      let toolCount = 0;

      if (Array.isArray(parsed.blog_posts) && parsed.blog_posts.length > 0) {
        const rows = parsed.blog_posts.map((p: any) => ({
          title: p.title,
          slug: p.slug,
          content: p.content || "",
          excerpt: p.excerpt || "",
          image_url: p.image_url || null,
          published_at: p.published_at || null,
        }));
        const { error } = await supabase.from("blog_posts").insert(rows);
        if (error) throw error;
        blogCount = rows.length;
      }

      if (Array.isArray(parsed.tools) && parsed.tools.length > 0) {
        const rows = parsed.tools.map((t: any) => {
          if (!isSafeUrl(t.url)) throw new Error(`Invalid URL for tool "${t.name}": must start with http:// or https://`);
          return {
            name: t.name,
            description: t.description,
            url: t.url,
            category: t.category,
          };
        });
        const { error } = await supabase.from("tools").insert(rows);
        if (error) throw error;
        toolCount = rows.length;
      }

      if (blogCount === 0 && toolCount === 0) {
        toast.error("No blog_posts or tools found in JSON");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });

      const parts = [];
      if (blogCount > 0) parts.push(`${blogCount} blog posts`);
      if (toolCount > 0) parts.push(`${toolCount} tools`);
      toast.success(`Imported ${parts.join(" and ")}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to import JSON");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={importing}>
        <Upload className="mr-1 h-4 w-4" />
        {importing ? "Importing..." : "Import Data"}
      </Button>
    </>
  );
};

export default JsonImportButton;
