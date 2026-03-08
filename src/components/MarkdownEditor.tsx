import { useCallback } from "react";
import MDEditor from "@uiw/react-md-editor";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor = ({ value, onChange }: MarkdownEditorProps) => {
  const handleChange = useCallback(
    (val?: string) => onChange(val ?? ""),
    [onChange]
  );

  return (
    <div data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={handleChange}
        height={400}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  );
};

export default MarkdownEditor;
