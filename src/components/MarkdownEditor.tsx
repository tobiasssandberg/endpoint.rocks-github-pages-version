import { useCallback, useRef, useState } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { optimizeImage } from "@/lib/imageOptimizer";
import { ImagePlus, Images } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImagePicker from "@/components/admin/ImagePicker";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

async function uploadImage(file: File): Promise<string | null> {
  const optimized = await optimizeImage(file);
  const ext = optimized.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, optimized, { cacheControl: "3600", upsert: false });

  if (error) {
    toast.error("Image upload failed: " + error.message);
    return null;
  }

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

const MarkdownEditor = ({ value, onChange }: MarkdownEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textApiRef = useRef<any>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleChange = useCallback(
    (val?: string) => onChange(val ?? ""),
    [onChange]
  );

  const insertImageMarkdown = useCallback(
    async (file: File) => {
      toast.info("Uploading image...");
      const url = await uploadImage(file);
      if (!url) return;

      const markdown = `![${file.name}](${url})`;

      if (textApiRef.current) {
        textApiRef.current.replaceSelection(markdown);
      } else {
        onChange(value + "\n" + markdown);
      }
      toast.success("Image inserted!");
    },
    [value, onChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) insertImageMarkdown(file);
      e.target.value = "";
    },
    [insertImageMarkdown]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) insertImageMarkdown(file);
          return;
        }
      }
    },
    [insertImageMarkdown]
  );

  const handlePickerSelect = useCallback(
    (url: string) => {
      const markdown = `![image](${url})`;
      if (textApiRef.current) {
        textApiRef.current.replaceSelection(markdown);
      } else {
        onChange(value + "\n" + markdown);
      }
      setPickerOpen(false);
      toast.success("Image inserted!");
    },
    [value, onChange]
  );

  const imageUploadCommand: commands.ICommand = {
    name: "image-upload",
    keyCommand: "image-upload",
    buttonProps: { "aria-label": "Upload image", title: "Upload image" },
    icon: <ImagePlus className="h-3 w-3" />,
    execute: () => {
      fileInputRef.current?.click();
    },
  };

  const imageLibraryCommand: commands.ICommand = {
    name: "image-library",
    keyCommand: "image-library",
    buttonProps: { "aria-label": "Pick from library", title: "Pick from library" },
    icon: <Images className="h-3 w-3" />,
    execute: () => {
      setPickerOpen(true);
    },
  };

  return (
    <div data-color-mode="dark" onPaste={handlePaste}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <MDEditor
        value={value}
        onChange={handleChange}
        height={400}
        preview="live"
        visibleDragbar={false}
        commands={[
          commands.bold,
          commands.italic,
          commands.strikethrough,
          commands.hr,
          commands.title,
          commands.divider,
          commands.link,
          commands.quote,
          commands.code,
          commands.codeBlock,
          commands.divider,
          commands.unorderedListCommand,
          commands.orderedListCommand,
          commands.checkedListCommand,
          commands.divider,
          imageUploadCommand,
          imageLibraryCommand,
        ]}
        commandsFilter={(cmd) => cmd}
        textareaProps={{
          spellCheck: true,
          lang: "en",
          onPaste: (e: any) => handlePaste(e),
        }}
      />

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pick from Image Library</DialogTitle>
          </DialogHeader>
          <ImagePicker onSelect={handlePickerSelect} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarkdownEditor;
