import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Search } from "lucide-react";
import { toast } from "sonner";

interface ImagePickerProps {
  onSelect: (url: string) => void;
}

async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) {
    toast.error("Upload failed: " + error.message);
    return null;
  }
  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

const ImagePicker = ({ onSelect }: ImagePickerProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

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

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage.from("blog-images").getPublicUrl(name);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    e.target.value = "";
    if (url) {
      queryClient.invalidateQueries({ queryKey: ["storage-images"] });
      onSelect(url);
    }
  };

  const filtered = files?.filter((f) =>
    search ? f.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No images found.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
          {filtered.map((file) => (
            <button
              key={file.name}
              type="button"
              onClick={() => onSelect(getPublicUrl(file.name))}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 hover:border-primary transition-colors"
            >
              <img
                src={getPublicUrl(file.name)}
                alt={file.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium text-white">Select</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePicker;
