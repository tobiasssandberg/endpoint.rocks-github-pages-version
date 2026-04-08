import { useState, useEffect, useCallback, useRef } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Pencil, Trash2, Plus, LogOut, CalendarIcon, GripVertical, Eye, ChevronDown, X, ImageIcon } from "lucide-react";
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
import BlogPreview from "@/components/admin/BlogPreview";
import ImagePicker from "@/components/admin/ImagePicker";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CATEGORIES = [
  "Management Tools & Scripts",
  "Solutions",
  "Tools for Documentation",
  "Application Management",
];

interface ToolForm { name: string; description: string; url: string; category: string; }
interface BlogForm {
  title: string; slug: string; content: string; excerpt: string;
  image_url: string; published_at: string;
  meta_title: string; meta_description: string; og_image: string;
}

const emptyToolForm: ToolForm = { name: "", description: "", url: "", category: CATEGORIES[0] };
const emptyBlogForm: BlogForm = {
  title: "", slug: "", content: "", excerpt: "", image_url: "", published_at: "",
  meta_title: "", meta_description: "", og_image: "",
};

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

// Tag input component
const TagInput = ({ selectedTags, allTags, onChange }: { selectedTags: string[]; allTags: { id: string; name: string }[]; onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState("");
  const suggestions = allTags.filter((t) => !selectedTags.includes(t.name) && t.name.toLowerCase().includes(input.toLowerCase())).slice(0, 5);
  const addTag = (name: string) => {
    if (!selectedTags.includes(name)) onChange([...selectedTags, name]);
    setInput("");
  };
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-muted-foreground">Tags</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selectedTags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 pr-1">
            {t}
            <button type="button" onClick={() => onChange(selectedTags.filter((x) => x !== t))} className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          placeholder="Add tag..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              addTag(input.trim());
            }
          }}
        />
        {input && suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md">
            {suggestions.map((s) => (
              <button key={s.id} type="button" onClick={() => addTag(s.name)}
                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent">{s.name}</button>
            ))}
          </div>
        )}
      </div>
    </div>
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
  const [blogTags, setBlogTags] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<"image_url" | "og_image">("image_url");
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);

  const getStoredDraft = (): {
    blogForm: BlogForm;
    blogTags: string[];
    savedAt?: string;
    blogEditId: string | null;
  } | null => {
    try {
      const saved = localStorage.getItem("blog-draft");
      if (!saved) return null;

      const draft = JSON.parse(saved);
      if (!draft?.blogForm) return null;

      return {
        blogForm: { ...emptyBlogForm, ...draft.blogForm },
        blogTags: Array.isArray(draft.blogTags) ? draft.blogTags : [],
        savedAt: typeof draft.savedAt === "string" ? draft.savedAt : undefined,
        blogEditId: typeof draft.blogEditId === "string" ? draft.blogEditId : null,
      };
    } catch {
      return null;
    }
  };

  // Refs so the interval always reads fresh data without resetting
  const blogFormRef = useRef(blogForm);
  const blogTagsRef = useRef(blogTags);
  const blogEditIdRef = useRef(blogEditId);
  const blogDialogOpenRef = useRef(blogDialogOpen);
  useEffect(() => { blogFormRef.current = blogForm; }, [blogForm]);
  useEffect(() => { blogTagsRef.current = blogTags; }, [blogTags]);
  useEffect(() => { blogEditIdRef.current = blogEditId; }, [blogEditId]);
  useEffect(() => { blogDialogOpenRef.current = blogDialogOpen; }, [blogDialogOpen]);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [loading, user, navigate]);
  useEffect(() => { if (!loading && user && !isAdmin) navigate("/"); }, [loading, user, isAdmin, navigate]);

  // Fix: restore body overflow when leaving Admin (Radix Dialog may leave overflow:hidden)
  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("blog-draft");
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft?.savedAt) setLastAutoSaved(new Date(draft.savedAt));
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!blogDialogOpenRef.current) return;

      const form = blogFormRef.current;
      if (!form.title && !form.content) return;

      try {
        const now = new Date();
        localStorage.setItem(
          "blog-draft",
          JSON.stringify({
            blogForm: form,
            blogTags: blogTagsRef.current,
            blogEditId: blogEditIdRef.current,
            savedAt: now.toISOString(),
          })
        );
        setLastAutoSaved(now);
        toast("Draft auto-saved", { duration: 1500 });
      } catch {}
    }, 30000);

    return () => clearInterval(timer);
  }, []);

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

  // All tags
  const { data: allTags } = useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_tags").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && isAdmin,
  });

  // Load tags for a post when editing
  const loadPostTags = async (postId: string) => {
    const { data } = await supabase
      .from("blog_post_tags")
      .select("tag_id, blog_tags(name)")
      .eq("post_id", postId);
    return (data ?? []).map((r: any) => r.blog_tags?.name).filter(Boolean);
  };

  const saveBlogMutation = useMutation({
    mutationFn: async (post: BlogForm & { id?: string; tags: string[] }) => {
      const payload: any = {
        title: post.title, slug: post.slug, content: post.content,
        excerpt: post.excerpt, image_url: post.image_url || null, published_at: post.published_at || null,
        meta_title: post.meta_title || null, meta_description: post.meta_description || null, og_image: post.og_image || null,
      };
      let postId = post.id;
      if (post.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", post.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("blog_posts").insert(payload).select("id").single();
        if (error) throw error;
        postId = data.id;
      }

      // Save tags
      // 1. Delete existing
      await supabase.from("blog_post_tags").delete().eq("post_id", postId!);
      // 2. Upsert tag names and link
      for (const tagName of post.tags) {
        const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { data: tagData } = await supabase.from("blog_tags").upsert({ name: tagName, slug }, { onConflict: "slug" }).select("id").single();
        if (tagData) {
          await supabase.from("blog_post_tags").insert({ post_id: postId!, tag_id: tagData.id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
      toast.success(blogEditId ? "Post updated" : "Post added");
      setBlogDialogOpen(false);
      setBlogForm(emptyBlogForm);
      setBlogEditId(null);
      setBlogTags([]);
      setLastAutoSaved(null);
      localStorage.removeItem("blog-draft");
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

  const openNewBlogPost = () => {
    const storedDraft = getStoredDraft();

    if (storedDraft && !storedDraft.blogEditId) {
      setBlogForm(storedDraft.blogForm);
      setBlogTags(storedDraft.blogTags);
      setLastAutoSaved(storedDraft.savedAt ? new Date(storedDraft.savedAt) : null);
      toast.info("Opened autosaved draft");
    } else {
      setBlogForm(emptyBlogForm);
      setBlogTags([]);
      setLastAutoSaved(null);
    }

    setBlogEditId(null);
    setBlogDialogOpen(true);
  };

  const openBlogEdit = async (post: any) => {
    const storedDraft = getStoredDraft();

    if (storedDraft?.blogEditId === post.id) {
      setBlogForm(storedDraft.blogForm);
      setBlogTags(storedDraft.blogTags);
      setLastAutoSaved(storedDraft.savedAt ? new Date(storedDraft.savedAt) : null);
      toast.info("Restored autosaved changes for this post");
    } else {
      setBlogForm({
        title: post.title, slug: post.slug, content: post.content,
        excerpt: post.excerpt, image_url: post.image_url || "", published_at: post.published_at ? post.published_at.slice(0, 16) : "",
        meta_title: post.meta_title || "", meta_description: post.meta_description || "", og_image: post.og_image || "",
      });
      const tags = await loadPostTags(post.id);
      setBlogTags(tags);
      setLastAutoSaved(null);
    }

    setBlogEditId(post.id);
    setBlogDialogOpen(true);
  };

  const submitBlog = (draft: boolean) => {
    const slug = blogForm.slug || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `draft-${Date.now()}`;
    const pub = {
      ...blogForm, slug,
      published_at: draft ? "" : (blogForm.published_at || new Date().toISOString().slice(0, 16)),
      tags: blogTags,
    };
    saveBlogMutation.mutate(blogEditId ? { ...pub, id: blogEditId } : pub);
  };

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
                  <Button onClick={openNewBlogPost}>
                    <Plus className="mr-1 h-4 w-4" /> New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{blogEditId ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); submitBlog(false); }} className="space-y-4">
                    <Input placeholder="Title" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} required />
                    <Input placeholder="Slug (auto-generated if empty)" value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} />

                    {/* Cover image */}
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">Cover image</label>
                      <div className="flex gap-2 items-center">
                        {blogForm.image_url && (
                          <img src={blogForm.image_url} alt="Cover" className="h-12 w-12 rounded object-cover border border-border/50" />
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={() => { setImagePickerTarget("image_url"); setImagePickerOpen(true); }}>
                          <ImageIcon className="mr-1 h-4 w-4" /> {blogForm.image_url ? "Change" : "Pick image"}
                        </Button>
                        {blogForm.image_url && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setBlogForm({ ...blogForm, image_url: "" })}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Textarea placeholder="Excerpt" value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} rows={2} />
                    <MarkdownEditor value={blogForm.content} onChange={(v) => setBlogForm({ ...blogForm, content: v })} />

                    <TagInput selectedTags={blogTags} allTags={allTags ?? []} onChange={setBlogTags} />

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

                    {/* SEO section */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                          SEO Settings <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Meta Title ({blogForm.meta_title.length}/60)</label>
                          <Input placeholder={blogForm.title || "Meta title"} value={blogForm.meta_title}
                            onChange={(e) => setBlogForm({ ...blogForm, meta_title: e.target.value })} maxLength={60} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Meta Description ({blogForm.meta_description.length}/160)</label>
                          <Textarea placeholder={blogForm.excerpt || "Meta description"} value={blogForm.meta_description}
                            onChange={(e) => setBlogForm({ ...blogForm, meta_description: e.target.value })} maxLength={160} rows={2} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">OG Image</label>
                          <div className="flex gap-2 items-center">
                            {blogForm.og_image && <img src={blogForm.og_image} alt="OG" className="h-10 w-16 rounded object-cover border border-border/50" />}
                            <Button type="button" variant="outline" size="sm" onClick={() => { setImagePickerTarget("og_image"); setImagePickerOpen(true); }}>
                              <ImageIcon className="mr-1 h-3 w-3" /> {blogForm.og_image ? "Change" : "Pick"}
                            </Button>
                            {blogForm.og_image && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => setBlogForm({ ...blogForm, og_image: "" })}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="flex gap-2 items-center">
                      <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                        <Eye className="mr-1 h-4 w-4" /> Preview
                      </Button>
                      {lastAutoSaved && (
                        <span className="text-xs text-muted-foreground">
                          Auto-saved {format(lastAutoSaved, "HH:mm:ss")}
                        </span>
                      )}
                      <div className="flex-1" />
                      <Button type="button" variant="outline" disabled={saveBlogMutation.isPending} onClick={() => submitBlog(true)}>
                        {saveBlogMutation.isPending ? "Saving..." : "Save as Draft"}
                      </Button>
                      <Button type="submit" disabled={saveBlogMutation.isPending}>
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
                          <Button variant="ghost" size="icon" onClick={() => openBlogEdit(post)}>
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

          <TabsContent value="images"><ImageLibrary /></TabsContent>
          <TabsContent value="analytics"><AnalyticsOverview /></TabsContent>
          <TabsContent value="settings"><SiteSettings /></TabsContent>
        </Tabs>
      </main>

      {/* Blog preview sheet */}
      <BlogPreview open={previewOpen} onOpenChange={setPreviewOpen} post={{ ...blogForm, tags: blogTags }} />

      {/* Image picker dialog */}
      <Dialog open={imagePickerOpen} onOpenChange={setImagePickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Pick Image</DialogTitle></DialogHeader>
          <ImagePicker onSelect={(url) => {
            setBlogForm({ ...blogForm, [imagePickerTarget]: url });
            setImagePickerOpen(false);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
