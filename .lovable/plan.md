

## Bildförstoring i blogginlägg

Lägger till en enkel lightbox-effekt: klick på en bild i ett blogginlägg öppnar den i en fullskärms-overlay med möjlighet att stänga via klick eller Escape.

### Implementation

1. **Ny komponent `src/components/ImageLightbox.tsx`**
   - En overlay (`fixed inset-0 z-50 bg-black/90`) som visar bilden centrerad i full storlek (`max-w-[90vw] max-h-[90vh] object-contain`).
   - Stängs via klick på bakgrunden, X-knapp, eller Escape-tangenten.
   - Fade-in/out animation.

2. **`src/pages/BlogPost.tsx`**
   - State för vald bild-URL.
   - Wrappa bilder i klickbara element:
     - **Markdown-rendering:** Skicka en custom `components={{ img }}` till `ReactMarkdown` som renderar bilder med `cursor-pointer` och `onClick` som öppnar lightboxen.
     - **HTML-rendering:** Lägg till en `onClick`-delegering på prose-containern som lyssnar på klick på `<img>`-element.
   - Rendera `ImageLightbox` längst ner.

3. **`src/components/admin/BlogPreview.tsx`**
   - Samma logik som ovan så att preview också visar lightbox-beteendet.

Inga nya beroenden. Inga databasändringar.

