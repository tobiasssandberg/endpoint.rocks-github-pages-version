import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, LogOut, CalendarIcon, GripVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import JsonImportButton from "@/components/JsonImportButton";
import { toast } from "sonner";
import MarkdownEditor from "@/components/MarkdownEditor";
import { isSafeUrl } from "@/lib/urlValidation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ImageLibrary from "@/components/admin/ImageLibrary";
import SiteSettings from "@/components/admin/SiteSettings";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// Sortable row component for tools
const SortableToolRow = ({ tool, onEdit, onDelete }: { tool: any; onEdit: () => void; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tool.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8">
        <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{tool.name}</TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{tool.category}</TableCell>
      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-xs truncate">
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{tool.url}</a>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [toolForm, setToolForm] = useState<ToolForm>(emptyToolForm);
  const [toolEditId, setToolEditId] = useState<string | null>(null);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);

  const [blogForm, setBlogForm] = useState<BlogForm>(emptyBlogForm);
  const [blogEditId, setBlogEditId] = useState<string | null>(null);
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [loading, user, navigate]);
  useEffect(() => { if (!loading && user && !isAdmin) navigate("/"); }, [loading, user, isAdmin, navigate]);

  // Tools
  const { data: tools } = useQuery({
    queryKey: ["admin-tools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tools").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase.from("tools").update({ sort_order: item.sort_order }).eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !tools) return;
    const oldIndex = tools.findIndex((t) => t.id === active.id);
    const newIndex = tools.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tools, oldIndex, newIndex);
    // Optimistically update cache
    queryClient.setQueryData(["admin-tools"], reordered);
    reorderMutation.mutate(reordered.map((t, i) => ({ id: t.id, sort_order: i })));
  }, [tools, queryClient, reorderMutation]);

  const saveToolMutation = useMutation({
    mutationFn: async (tool: ToolForm & { id?: string }) => {
      if (!isSafeUrl(tool.url)) throw new Error("URL must start with http:// or https://");
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

  // Blog
  const { data: blogPosts } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  const saveBlogMutation = useMutation({
    mutationFn: async (post: BlogForm & { id?: string }) => {
      const payload = {
        title: post.title, slug: post.slug, content: post.content,
        excerpt: post.excerpt, image_url: post.image_url || null, published_at: post.published_at || null,
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

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <span className="text-xl font-bold"><span className="text-primary">Endpoint</span><span className="text-foreground">.rocks</span></span>
            <span className="ml-2 rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">Admin</span>
          </button>
          <div className="flex items-center gap-3">
            <JsonImportButton />
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="blog">Blog ({blogPosts?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="tools">Tools ({tools?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><AdminDashboard /></TabsContent>

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
                  <DialogHeader><DialogTitle>{toolEditId ? "Edit Tool" : "Add Tool"}</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); saveToolMutation.mutate(toolEditId ? { ...toolForm, id: toolEditId } : toolForm); }} className="space-y-4">
                    <Input placeholder="Name" value={toolForm.name} onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })} required />
                    <Textarea placeholder="Description" value={toolForm.description} onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })} required />
                    <Input placeholder="URL" value={toolForm.url} onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })} required />
                    <Select value={toolForm.category} onValueChange={(v) => setToolForm({ ...toolForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button type="submit" className="w-full" disabled={saveToolMutation.isPending}>
                      {saveToolMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">Drag rows to reorder tools.</p>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">URL</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={tools?.map((t) => t.id) ?? []} strategy={verticalListSortingStrategy}>
                    <TableBody>
                      {tools?.map((tool) => (
                        <SortableToolRow
                          key={tool.id}
                          tool={tool}
                          onEdit={() => { setToolForm({ name: tool.name, description: tool.description, url: tool.url, category: tool.category }); setToolEditId(tool.id); setToolDialogOpen(true); }}
                          onDelete={() => { if (confirm("Delete this tool?")) deleteToolMutation.mutate(tool.id); }}
                        />
                      ))}
                    </TableBody>
                  </SortableContext>
                </DndContext>
              </Table>
            </div>
          </TabsContent>

          {/* BLOG TAB */}
          <TabsContent value="blog">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Blog</h2>
              <Dialog open={blogDialogOpen} onOpenChange={setBlogDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setBlogForm(emptyBlogForm); setBlogEditId(null); setBlogDialogOpen(true); }}>
                    <Plus className="mr-1 h-4 w-4" /> New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{blogEditId ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); const slug = blogForm.slug || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `draft-${Date.now()}`; const pub = { ...blogForm, slug, published_at: blogForm.published_at || new Date().toISOString().slice(0, 16) }; saveBlogMutation.mutate(blogEditId ? { ...pub, id: blogEditId } : pub); }} className="space-y-4">
                    <Input placeholder="Title" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} required />
                    <Input placeholder="Slug (auto-generated if empty)" value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} />
                    <Input placeholder="Image URL (optional)" value={blogForm.image_url} onChange={(e) => setBlogForm({ ...blogForm, image_url: e.target.value })} />
                    <Textarea placeholder="Excerpt" value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} rows={2} />
                    <MarkdownEditor value={blogForm.content} onChange={(v) => setBlogForm({ ...blogForm, content: v })} />
                    <div>
                      <label className="text-sm text-muted-foreground">Publish date & time</label>
                      <div className="flex gap-2 mt-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !blogForm.published_at && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {blogForm.published_at ? format(parseISO(blogForm.published_at), "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={blogForm.published_at ? parseISO(blogForm.published_at) : undefined}
                              onSelect={(date) => {
                                if (!date) { setBlogForm({ ...blogForm, published_at: "" }); return; }
                                const existing = blogForm.published_at ? parseISO(blogForm.published_at) : new Date();
                                date.setHours(existing.getHours(), existing.getMinutes());
                                setBlogForm({ ...blogForm, published_at: date.toISOString().slice(0, 16) });
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="w-28"
                          value={blogForm.published_at ? blogForm.published_at.slice(11, 16) : ""}
                          onChange={(e) => {
                            const time = e.target.value;
                            if (!blogForm.published_at) {
                              setBlogForm({ ...blogForm, published_at: `${new Date().toISOString().slice(0, 10)}T${time}` });
                            } else {
                              setBlogForm({ ...blogForm, published_at: blogForm.published_at.slice(0, 11) + time });
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" disabled={saveBlogMutation.isPending}
                        onClick={() => {
                          const slug = blogForm.slug || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `draft-${Date.now()}`;
                          saveBlogMutation.mutate(blogEditId ? { ...blogForm, slug, published_at: "", id: blogEditId } : { ...blogForm, slug, published_at: "" });
                        }}
                      >
                        {saveBlogMutation.isPending ? "Saving..." : "Save as Draft"}
                      </Button>
                      <Button type="submit" className="flex-1" disabled={saveBlogMutation.isPending}>
                        {saveBlogMutation.isPending ? "Saving..." : blogForm.published_at ? "Publish" : "Publish Now"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                    <TableRow key={post.id} className={!post.published_at ? "bg-muted/30" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {post.title}
                          {!post.published_at && <Badge variant="outline" className="text-xs border-[hsl(var(--destructive))] text-[hsl(var(--destructive))]">Draft</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString("sv-SE") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setBlogForm({ title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt, image_url: post.image_url || "", published_at: post.published_at ? post.published_at.slice(0, 16) : "" });
                            setBlogEditId(post.id);
                            setBlogDialogOpen(true);
                          }}><Pencil className="h-4 w-4" /></Button>
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

          <TabsContent value="images"><ImageLibrary /></TabsContent>
          <TabsContent value="analytics"><AnalyticsOverview /></TabsContent>
          <TabsContent value="settings"><SiteSettings /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
