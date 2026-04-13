

## Bildoptimering vid upload

### Problem
Bilder laddas upp i originalstorlek och -format utan komprimering, vilket ger onödigt stora filer och långsammare laddtider.

### Lösning
Skapa en gemensam `optimizeImage`-funktion som använder Canvas API i webbläsaren för att resiza och komprimera bilder innan de laddas upp till storage. Konverterar till WebP (med JPEG-fallback) och begränsar maxbredd till 1600px.

### Ändringar

**Ny fil: `src/lib/imageOptimizer.ts`**
- Funktion `optimizeImage(file: File, options?)` som returnerar en optimerad `File`
- Laddar bilden i en `<canvas>`, skalar ner till max 1600px bredd (bibehåller proportioner)
- Exporterar som WebP (quality 0.82), faller tillbaka till JPEG om WebP ej stöds
- Skippar optimering om filen redan är under 100 KB
- Skippar SVG/GIF (dessa bör inte rasteriseras)

**`src/components/admin/ImagePicker.tsx`** — Anropa `optimizeImage(file)` innan `supabase.storage.upload()`

**`src/components/MarkdownEditor.tsx`** — Samma ändring i dess `uploadImage`-funktion

Ingen serverändring behövs — allt sker client-side före upload.

