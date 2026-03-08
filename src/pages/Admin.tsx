import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Management Tools & Scripts",
  "Solutions",
  "Tools for Documentation",
  "Application Management",
];

interface ToolForm {
  name: string;
  description: string;
  url: string;
  category: string;
}

interface BlogForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string;
  published_at: string;
}

const emptyToolForm: ToolForm = { name: "", description: "", url: "", category: CATEGORIES[0] };
const emptyBlogForm: BlogForm = { title: "", slug: "", content: "", excerpt: "", image_url: "", published_at: "" };

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Tools state
  const [toolForm, setToolForm] = useState<ToolForm>(emptyToolForm);
  const [toolEditId, setToolEditId] = useState<string | null>(null);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);

  // Blog state
  const [blogForm, setBlogForm] = useState<BlogForm>(emptyBlogForm);
  const [blogEditId, setBlogEditId] = useState<string | null>(null);
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // Tools queries & mutations
  const { data: tools } = useQuery({
    queryKey: ["admin-tools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tools").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveToolMutation = useMutation({
    mutationFn: async (tool: ToolForm & { id?: string }) => {
      if (tool.id) {
        const { error } = await supabase.from("tools").update(tool).eq("id", tool.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tools").insert(tool);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success(toolEditId ? "Tool updated" : "Tool added");
      setToolDialogOpen(false);
      setToolForm(emptyToolForm);
      setToolEditId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tool deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Blog queries & mutations
  const { data: blogPosts } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveBlogMutation = useMutation({
    mutationFn: async (post: BlogForm & { id?: string }) => {
      const payload = {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        image_url: post.image_url || null,
        published_at: post.published_at || null,
      };
      if (post.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success(blogEditId ? "Post updated" : "Post added");
      setBlogDialogOpen(false);
      setBlogForm(emptyBlogForm);
      setBlogEditId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncFromRSS = async () => {
    setSyncing(true);
    try {
      // Get the user's session JWT for authenticated admin access
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) {
        throw new Error("You must be logged in to sync");
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rss-feed?migrate=true`,
        { headers: { Authorization: `Bearer ${currentSession.access_token}` } }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success(`Synced ${result.migrated} posts from RSS`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-4">
        <p className="text-muted-foreground">You don't have admin access.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>Back to site</Button>
          <Button variant="ghost" onClick={signOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Endpoint</span>
            <span className="text-xl font-bold text-foreground">.rocks</span>
            <span className="ml-2 rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tools">
          <TabsList className="mb-6">
            <TabsTrigger value="tools">Tools ({tools?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="blog">Blog ({blogPosts?.length ?? 0})</TabsTrigger>
          </TabsList>

          {/* TOOLS TAB */}
          <TabsContent value="tools">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Tools</h2>
              <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setToolForm(emptyToolForm); setToolEditId(null); setToolDialogOpen(true); }}>
                    <Plus className="mr-1 h-4 w-4" /> Add Tool
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{toolEditId ? "Edit Tool" : "Add Tool"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); saveToolMutation.mutate(toolEditId ? { ...toolForm, id: toolEditId } : toolForm); }} className="space-y-4">
                    <Input placeholder="Name" value={toolForm.name} onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })} required />
                    <Textarea placeholder="Description" value={toolForm.description} onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })} required />
                    <Input placeholder="URL" value={toolForm.url} onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })} required />
                    <Select value={toolForm.category} onValueChange={(v) => setToolForm({ ...toolForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Button type="submit" className="w-full" disabled={saveToolMutation.isPending}>
                      {saveToolMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">URL</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools?.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{tool.category}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-xs truncate">
                        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{tool.url}</a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setToolForm({ name: tool.name, description: tool.description, url: tool.url, category: tool.category }); setToolEditId(tool.id); setToolDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this tool?")) deleteToolMutation.mutate(tool.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* BLOG TAB */}
          <TabsContent value="blog">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Blog</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={syncFromRSS} disabled={syncing}>
                  <RefreshCw className={`mr-1 h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sync from RSS
                </Button>
                <Dialog open={blogDialogOpen} onOpenChange={setBlogDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setBlogForm(emptyBlogForm); setBlogEditId(null); setBlogDialogOpen(true); }}>
                      <Plus className="mr-1 h-4 w-4" /> New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{blogEditId ? "Edit Post" : "New Post"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); saveBlogMutation.mutate(blogEditId ? { ...blogForm, id: blogEditId } : blogForm); }} className="space-y-4">
                      <Input placeholder="Title" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} required />
                      <Input placeholder="Slug (url-friendly)" value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} required />
                      <Input placeholder="Image URL (optional)" value={blogForm.image_url} onChange={(e) => setBlogForm({ ...blogForm, image_url: e.target.value })} />
                      <Textarea placeholder="Excerpt (short summary)" value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} rows={2} required />
                      <Textarea placeholder="Content (HTML)" value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} rows={12} required />
                      <Input type="datetime-local" value={blogForm.published_at} onChange={(e) => setBlogForm({ ...blogForm, published_at: e.target.value })} />
                      <Button type="submit" className="w-full" disabled={saveBlogMutation.isPending}>
                        {saveBlogMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Published</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPosts?.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString("sv-SE") : "Draft"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setBlogForm({
                              title: post.title,
                              slug: post.slug,
                              content: post.content,
                              excerpt: post.excerpt,
                              image_url: post.image_url || "",
                              published_at: post.published_at ? post.published_at.slice(0, 16) : "",
                            });
                            setBlogEditId(post.id);
                            setBlogDialogOpen(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this post?")) deleteBlogMutation.mutate(post.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
