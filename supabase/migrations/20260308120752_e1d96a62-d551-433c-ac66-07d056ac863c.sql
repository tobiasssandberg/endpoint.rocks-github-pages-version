INSERT INTO public.user_roles (user_id, role)
VALUES ('f6817cde-7799-49fe-922f-de6cac3c370f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;