import { useCallback, useRef } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

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

  const imageUploadCommand: commands.ICommand = {
    name: "image-upload",
    keyCommand: "image-upload",
    buttonProps: { "aria-label": "Upload image", title: "Upload image" },
    icon: <ImagePlus className="h-3 w-3" />,
    execute: () => {
      fileInputRef.current?.click();
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
        ]}
        commandsFilter={(cmd) => cmd}
        textareaProps={{
          onPaste: (e: any) => handlePaste(e),
        }}
      />
    </div>
  );
};

export default MarkdownEditor;
