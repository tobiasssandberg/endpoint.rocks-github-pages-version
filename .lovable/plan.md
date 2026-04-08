

## GA Event Tracking

Lägger till `gtag('event', ...)`-anrop på viktiga interaktioner utan att ändra beteende eller utseende.

### Ny hjälpfunktion — `src/lib/analytics.ts`

Skapar en liten wrapper:
```ts
export const trackEvent = (action: string, params?: Record<string, string>) => {
  window.gtag?.('event', action, params);
};
```

### Events som spåras

| Komponent | Interaktion | Event-namn | Parametrar |
|-----------|------------|------------|------------|
| `ToolCatalog.tsx` | Klick på verktyg (extern länk) | `tool_click` | `tool_name`, `tool_url`, `tool_category` |
| `ToolCatalog.tsx` | Byta kategori | `category_filter` | `category` |
| `BlogSection.tsx` | Klick på blogginlägg | `blog_click` | `post_title`, `post_slug` |
| `HeroSection.tsx` | Sökning (debounced) | `search` | `search_term` |

### Ändringar per fil

1. **`src/lib/analytics.ts`** (ny) — `trackEvent` wrapper
2. **`src/components/ToolCatalog.tsx`** — `onClick` på verktygs-länken + kategori-knappen
3. **`src/components/BlogSection.tsx`** — `onClick` på blogg-länken
4. **`src/components/HeroSection.tsx`** — trigga `search`-event vid sökning (med kort debounce)

Inga visuella ändringar. Inga nya beroenden.

