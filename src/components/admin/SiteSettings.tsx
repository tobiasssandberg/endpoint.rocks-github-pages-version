import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

const FIELDS = [
  { key: "about_name", label: "Name", type: "input" },
  { key: "about_description", label: "Description", type: "textarea" },
  { key: "about_avatar_url", label: "Avatar URL", type: "input" },
  { key: "about_github", label: "GitHub URL", type: "input" },
  { key: "about_linkedin", label: "LinkedIn URL", type: "input" },
  { key: "about_x", label: "X (Twitter) URL", type: "input" },
  { key: "about_email", label: "Email", type: "input" },
] as const;

const SiteSettings = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s: any) => { map[s.key] = s.value; });
      setForm(map);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const field of FIELDS) {
        const value = form[field.key] ?? "";
        const { error } = await supabase
          .from("site_settings")
          .update({ value })
          .eq("key", field.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Site Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.map((field) =>
            field.type === "textarea" ? (
              <div key={field.key}>
                <label className="text-sm text-muted-foreground">{field.label}</label>
                <Textarea
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  rows={3}
                />
              </div>
            ) : (
              <div key={field.key}>
                <label className="text-sm text-muted-foreground">{field.label}</label>
                <Input
                  value={form[field.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            )
          )}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
            <Save className="mr-1 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettings;
