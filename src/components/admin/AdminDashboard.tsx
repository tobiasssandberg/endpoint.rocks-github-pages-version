import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, PenLine, Wrench, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AdminDashboard = () => {
  const { data: blogPosts } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tools } = useQuery({
    queryKey: ["admin-tools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tools").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const published = blogPosts?.filter((p) => p.published_at) ?? [];
  const drafts = blogPosts?.filter((p) => !p.published_at) ?? [];

  // Combine recent activity from both tables
  const recentActivity = [
    ...(blogPosts?.slice(0, 5).map((p) => ({
      type: "blog" as const,
      title: p.title,
      date: p.updated_at,
      isDraft: !p.published_at,
    })) ?? []),
    ...(tools?.slice(0, 5).map((t) => ({
      type: "tool" as const,
      title: t.name,
      date: t.created_at,
      isDraft: false,
    })) ?? []),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{published.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            <PenLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{drafts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tools?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {item.type === "blog" ? (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{item.title}</span>
                    {item.isDraft && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Draft</span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
