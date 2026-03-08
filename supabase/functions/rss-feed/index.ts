import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const migrate = url.searchParams.get('migrate') === 'true';

    const response = await fetch('https://endpoint.rocks/feed/');
    const xml = await response.text();

    const items: Array<{
      title: string;
      link: string;
      pubDate: string;
      description: string;
      content: string;
      image?: string;
      slug: string;
    }> = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || 
                     itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const desc = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]>/s)?.[1] || 
                   itemXml.match(/<description>(.*?)<\/description>/s)?.[1] || '';
      const fullContent = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] || desc;
      const image = itemXml.match(/<media:content[^>]+url="([^"]+)"/)?.[1] || 
                     itemXml.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] ||
                     fullContent.match(/<img[^>]+src="([^"]+)"/)?.[1] || undefined;

      const cleanDesc = desc.replace(/<[^>]*>/g, '').substring(0, 200);
      
      const slug = link.replace(/https?:\/\/[^/]+/, '').replace(/\//g, '-').replace(/^-|-$/g, '') || 
                   title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      items.push({ title, link, pubDate, description: cleanDesc, content: fullContent, image, slug });
    }

    if (migrate) {
      // Authenticate the caller and verify admin role
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      // Verify the user's JWT using the anon client
      const anonClient = createClient(supabaseUrl, supabaseAnonKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check admin role
      const { data: roleData } = await anonClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Use service role client for the actual upsert
      const supabase = createClient(supabaseUrl, serviceKey);

      const postsToInsert = items.map(item => ({
        title: item.title.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c))),
        slug: item.slug,
        content: item.content,
        excerpt: item.description,
        image_url: item.image || null,
        published_at: new Date(item.pubDate).toISOString(),
      }));

      const { data, error } = await supabase
        .from('blog_posts')
        .upsert(postsToInsert, { onConflict: 'slug' })
        .select();

      if (error) throw error;

      return new Response(JSON.stringify({ migrated: data?.length ?? 0, posts: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normal mode: return simplified list
    return new Response(JSON.stringify(items.slice(0, 6).map(({ content, ...rest }) => rest)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('RSS function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
