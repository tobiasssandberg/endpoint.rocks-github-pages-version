import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const ImageLibrary = () => {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");

  const { data: files, isLoading } = useQuery({
    queryKey: ["storage-images"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("blog-images").list("", {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    },
  });

  // Fetch all blog post content + image_url to check usage
  const { data: postData } = useQuery({
    queryKey: ["blog-posts-content-urls"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("content, image_url");
      if (error) throw error;
      return data ?? [];
    },
  });

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage.from("blog-images").getPublicUrl(name);
    return data.publicUrl;
  };

  const isImageUsed = (name: string) => {
    if (!postData) return false;
    const url = getPublicUrl(name);
    return postData.some((p) => p.content?.includes(url) || p.image_url === url);
  };

  const copyUrl = (name: string) => {
    navigator.clipboard.writeText(getPublicUrl(name));
    toast.success("URL copied!");
  };

  const deleteFile = async (name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeleting(name);
    const { error } = await supabase.storage.from("blog-images").remove([name]);
    setDeleting(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Image deleted");
      queryClient.invalidateQueries({ queryKey: ["storage-images"] });
    }
  };

  const filteredFiles = files?.filter((f) => {
    if (filter === "all") return true;
    const used = isImageUsed(f.name);
    return filter === "used" ? used : !used;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Image Library</h2>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["all", "used", "unused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["storage-images"] })}
          >
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : !filteredFiles?.length ? (
        <p className="py-12 text-center text-muted-foreground">No images found.</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredFiles.map((file) => {
            const used = isImageUsed(file.name);
            return (
              <div
                key={file.name}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card"
              >
                <img
                  src={getPublicUrl(file.name)}
                  alt={file.name}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={used ? "default" : "outline"} className={`text-[10px] ${used ? "" : "bg-background/80"}`}>
                    {used ? "Used" : "Unused"}
                  </Badge>
                </div>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex w-full items-center justify-between p-2">
                    <span className="truncate text-xs text-white">{file.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => copyUrl(file.name)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-white/20"
                        disabled={deleting === file.name}
                        onClick={() => deleteFile(file.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageLibrary;
