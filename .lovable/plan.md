

## Plan: Lägg till "Om mig"-sektion på startsidan

En ny komponent `AboutSection` placeras mellan BlogSection och ToolCatalog på startsidan.

### Design

Sektionen följer sidans befintliga mörka tema med subtil border och kort layout:

- **Namn/rubrik** — t.ex. "About" eller ditt namn
- **Kort bio** — 2-3 meningar om vem du är och vad du jobbar med
- **Valfri profilbild** — avatar till vänster, text till höger (responsivt)
- **Kontaktlänkar** — GitHub (redan finns), LinkedIn, e-post etc. som ikoner

### Ändringar

1. **Skapa `src/components/AboutSection.tsx`** — Ny komponent med:
   - Sektion med `id="about"` för eventuell ankarlänkning
   - Flexbox-layout: avatar + textblock
   - Hårdkodad text (du redigerar innehållet direkt i koden eller så gör vi det redigerbart via admin senare)
   - Sociala länkar med Lucide-ikoner

2. **Uppdatera `src/pages/Index.tsx`** — Importera och placera `<AboutSection />` mellan `<BlogSection>` och `<ToolCatalog>`.

Ingen databas- eller backendändring behövs — allt är statiskt innehåll i koden.

