import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface JsonImportButtonProps {
  onImport: (data: any[]) => Promise<void>;
  label?: string;
}

const JsonImportButton = ({ onImport, label = "Import JSON" }: JsonImportButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
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
