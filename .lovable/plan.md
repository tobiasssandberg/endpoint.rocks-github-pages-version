

## Bloggförbättringar — 5 funktioner

### 1. Taggar/kategorier för blogginlägg

**Databasändring:** Ny tabell `blog_tags` (id, name, slug) och kopplingstabell `blog_post_tags` (post_id, tag_id) med RLS (publikt läsbar, admin CRUD). Migration lägger även till index.

**Admin:** Taggar visas som chips i blogg-formuläret. Ny input för att skapa/välja taggar (autocomplete från befintliga). Sparas vid submit via upsert + junction table.

**Publik sida:** `Blog.tsx` och `BlogSection.tsx` visar taggar som badges på varje kort. `Blog.tsx` får en tagg-filterrad överst.

### 2. Förhandsgranskning av blogginlägg

**Admin:** En "Preview"-knapp i blogg-dialogen öppnar en ny Dialog/Sheet som renderar inlägget med exakt samma layout som `BlogPost.tsx` (Header, hero-bild, markdown-rendering med `ReactMarkdown` + `remarkGfm`, typografi-klasser). Ingen routing — ren klientvy baserad på formulärdatan.

### 3. Bildbibliotek-väljare i bloggeditorn

**ImageLibrary-refactor:** Extrahera bildgalleri-griden till en återanvändbar `ImagePicker`-komponent som tar en `onSelect(url)` callback.

**MarkdownEditor:** Lägg till en ny toolbar-knapp "Pick from library" som öppnar en Dialog med `ImagePicker`. Vid val infogas `![image](url)` i editorn.

**Blog-formuläret:** "Image URL"-fältet ersätts med en knapp som öppnar samma `ImagePicker` + möjlighet att ladda upp ny bild. Vald bild visas som thumbnail.

### 4. Bildanvändningsstatus

**ImageLibrary:** Vid laddning, hämta alla `blog_posts.content` och `blog_posts.image_url`. Matcha varje bild-URL mot innehållet. Visa en "Used" / "Unused" badge på varje bild i galleriet. Filterknappar för att visa alla / bara oanvända.

### 5. SEO-fält per blogginlägg

**Databasändring:** Migration lägger till kolumner `meta_title TEXT`, `meta_description TEXT`, `og_image TEXT` på `blog_posts`.

**Admin:** Collapsible "SEO"-sektion i blogg-formuläret med fält för meta title, meta description, og_image (med ImagePicker). Teckenräknare för title (≤60) och description (≤160).

**BlogPost.tsx:** Använd `meta_title` (fallback till `title`), `meta_description` (fallback till `excerpt`), och `og_image` (fallback till `image_url`) i meta-taggarna och JSON-LD.

---

### Ändringsöversikt

| Fil | Ändring |
|-----|---------|
| Migration | `blog_tags`, `blog_post_tags` tabeller + `meta_title`, `meta_description`, `og_image` kolumner |
| `src/components/admin/ImagePicker.tsx` | Ny — återanvändbar bildväljare |
| `src/components/admin/ImageLibrary.tsx` | Refaktorera att använda ImagePicker + lägg till "used/unused" badge |
| `src/components/MarkdownEditor.tsx` | Ny toolbar-knapp för bildbiblioteket |
| `src/pages/Admin.tsx` | Taggar, SEO-sektion, preview-knapp, ImagePicker i formulär |
| `src/pages/BlogPost.tsx` | SEO-fält i meta-taggar |
| `src/pages/Blog.tsx` | Tagg-filter + visa taggar |
| `src/components/BlogSection.tsx` | Visa taggar på kort |

