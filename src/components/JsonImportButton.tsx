import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface JsonImportButtonProps {
  /** Called with the parsed array of items */
  onImport: (data: any[]) => Promise<void>;
  /** Key to extract from a wrapper object, e.g. "tools" or "blog_posts" */
  dataKey?: string;
  label?: string;
}

const JsonImportButton = ({ onImport, dataKey, label = "Import JSON" }: JsonImportButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      let items: any[];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (dataKey && Array.isArray(parsed[dataKey])) {
        items = parsed[dataKey];
      } else {
        // Try to find the first array property
        const firstArrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
        if (firstArrayKey) {
          items = parsed[firstArrayKey];
        } else {
          items = [parsed];
        }
      }

      if (items.length === 0) {
        toast.error("JSON file is empty");
        return;
      }
      await onImport(items);
      toast.success(`Imported ${items.length} items`);
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
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={importing}>
        <Upload className="mr-1 h-4 w-4" />
        {importing ? "Importing..." : label}
      </Button>
    </>
  );
};

export default JsonImportButton;
