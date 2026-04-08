

## Admin-panelen: 5 nya funktioner

Dessa fem tillägg bygger ut admin-gränssnittet med nya flikar och funktionalitet. Implementeras stegvis.

---

### 1. Dashboard med nyckeltal (ny flik)

En "Dashboard"-flik som förvald vy i admin med:
- Antal publicerade inlägg, utkast, totalt verktyg
- Senaste aktivitet (de 5 senaste ändrade blogginläggen/verktygen baserat på `updated_at`/`created_at`)
- Visas med kort/cards i en grid

Ingen databasändring — all data hämtas från befintliga tabeller (`blog_posts`, `tools`).

---

### 2. Bildbibliotek (ny flik)

En "Images"-flik som listar alla filer i `blog-images`-bucketen:
- Visar miniatyrbilder i en grid
- Knapp för att kopiera publik URL till clipboard
- Knapp för att radera bild (med bekräftelse)
- Använder `supabase.storage.from('blog-images').list()` och `.getPublicUrl()`

Ingen databasändring — använder befintlig storage-bucket.

---

### 3. Sortering/drag-and-drop för verktyg

Lägger till en `sort_order`-kolumn (integer, default 0) i `tools`-tabellen via migration. I admin-verktygsfliken:
- Verktyg grupperade per kategori
- Drag-and-drop med `@dnd-kit/core` + `@dnd-kit/sortable`
- Sparar ny ordning via batch-update till databasen
- Publik ToolCatalog sorterar på `sort_order` istället för `name`

**Databasändring:** `ALTER TABLE tools ADD COLUMN sort_order integer NOT NULL DEFAULT 0;`

---

### 4. GA-översikt i admin (ny flik)

En "Analytics"-flik som visar Google Analytics-data:
- Sidvisningar senaste 7/30 dagarna och populäraste sidor
- Kräver GA Data API (Google Analytics Reporting)
- Implementeras via en edge function som anropar GA4 Data API med ett service account
- Kräver en **Google Service Account JSON-nyckel** som secret

**Beroende:** Du behöver skapa ett Google Cloud Service Account med tillgång till GA4-propertyn och lägga till nyckeln som secret. Jag guidar dig genom det steget.

---

### 5. Redigera About-sektionen från admin (ny flik)

En "Site Settings"-flik där About-texten kan redigeras:
- Ny tabell `site_settings` med kolumner `key` (text, primary key) och `value` (text)
- Admin kan redigera namn, beskrivning, sociala länkar
- `AboutSection` hämtar data från `site_settings` istället för hårdkodade värden
- RLS: alla kan läsa, bara admin kan skriva

**Databasändring:** Ny tabell `site_settings` + RLS-policies + seed-data med nuvarande värden.

---

### Prioritetsordning

Jag föreslår att vi implementerar i denna ordning:
1. **Dashboard** — ingen DB-ändring, snabbast
2. **Bildbibliotek** — ingen DB-ändring, använder befintlig bucket
3. **Sortering** — enkel migration + nytt npm-paket
4. **Site Settings** — ny tabell + refaktorering av AboutSection
5. **GA-översikt** — kräver extern nyckel och edge function, mest komplext

### Filer som skapas/ändras

| Steg | Filer |
|------|-------|
| Dashboard | `src/pages/Admin.tsx` (ny flik + dashboard-komponent) |
| Bildbibliotek | `src/pages/Admin.tsx` (ny flik), ev. ny komponent `src/components/admin/ImageLibrary.tsx` |
| Sortering | Migration (ny kolumn), `src/pages/Admin.tsx` (drag-and-drop i verktygsflik), `src/components/ToolCatalog.tsx` (sortera på `sort_order`), nytt paket `@dnd-kit/core` |
| Site Settings | Migration (ny tabell), `src/pages/Admin.tsx` (ny flik), `src/components/AboutSection.tsx` (hämta dynamisk data) |
| GA-översikt | Edge function `supabase/functions/ga-report/index.ts`, `src/pages/Admin.tsx` (ny flik), ny secret (Google SA key) |

