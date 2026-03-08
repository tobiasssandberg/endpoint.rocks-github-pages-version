
-- Drop ALL existing policies on all tables
DROP POLICY IF EXISTS "Blog posts are publicly readable" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Tools are publicly readable" ON public.tools;
DROP POLICY IF EXISTS "Admins can insert tools" ON public.tools;
DROP POLICY IF EXISTS "Admins can update tools" ON public.tools;
DROP POLICY IF EXISTS "Admins can delete tools" ON public.tools;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- blog_posts: split public SELECT to only show published posts, admins see all
CREATE POLICY "Published posts are publicly readable"
ON public.blog_posts AS PERMISSIVE FOR SELECT TO anon
USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Authenticated users see published posts"
ON public.blog_posts AS PERMISSIVE FOR SELECT TO authenticated
USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Admins see all blog posts"
ON public.blog_posts AS PERMISSIVE FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blog posts"
ON public.blog_posts AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog posts"
ON public.blog_posts AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts AS PERMISSIVE FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- tools: PERMISSIVE policies
CREATE POLICY "Tools are publicly readable"
ON public.tools AS PERMISSIVE FOR SELECT
USING (true);

CREATE POLICY "Admins can insert tools"
ON public.tools AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tools"
ON public.tools AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tools"
ON public.tools AS PERMISSIVE FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- profiles: PERMISSIVE policies
CREATE POLICY "Users can view their own profile"
ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- user_roles: PERMISSIVE policies
CREATE POLICY "Users can view own roles"
ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
