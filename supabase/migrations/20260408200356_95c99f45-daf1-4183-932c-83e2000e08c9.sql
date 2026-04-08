-- Add sort_order to tools
ALTER TABLE public.tools ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Create site_settings table
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default About section values
INSERT INTO public.site_settings (key, value) VALUES
  ('about_name', 'Tobias Sandberg'),
  ('about_description', 'Principal Engineer at Xenit AB in Gothenburg, Sweden. Passionate about Microsoft Intune, automation and sharing useful resources here on Endpoint.rocks.'),
  ('about_avatar_url', 'https://avatars.githubusercontent.com/u/43400481?v=4'),
  ('about_github', 'https://github.com/tobiasssandberg'),
  ('about_linkedin', 'https://se.linkedin.com/in/tobias-sandberg'),
  ('about_x', 'https://x.com/tobiasssandberg'),
  ('about_email', 'tobias.sandberg@xenit.se');