
-- Blog tags table
CREATE TABLE public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are publicly readable" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins can insert tags" ON public.blog_tags FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tags" ON public.blog_tags FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tags" ON public.blog_tags FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Junction table
CREATE TABLE public.blog_post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  UNIQUE (post_id, tag_id)
);

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post tags are publicly readable" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admins can insert post tags" ON public.blog_post_tags FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete post tags" ON public.blog_post_tags FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_blog_post_tags_post_id ON public.blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag_id ON public.blog_post_tags(tag_id);

-- SEO columns on blog_posts
ALTER TABLE public.blog_posts ADD COLUMN meta_title TEXT;
ALTER TABLE public.blog_posts ADD COLUMN meta_description TEXT;
ALTER TABLE public.blog_posts ADD COLUMN og_image TEXT;
