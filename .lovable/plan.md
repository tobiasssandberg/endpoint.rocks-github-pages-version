

## Plan: Autosave, Dark/Light Mode & Scroll-bugg

### 1. Scroll-bugg fix

**Problemet:** Radix Dialog sätter `overflow: hidden` på `<body>` när en dialog är öppen. Om man navigerar bort från Admin via React Router (t.ex. klickar på logotypen) utan att stänga dialogen, rensas aldrig `overflow: hidden` — hela sidan blir olåst.

**Lösning:** Lägg till en `useEffect` cleanup i `Admin.tsx` som återställer `document.body.style.overflow` till `""` vid unmount. Kort och säkert.

### 2. Autosave för bloggutkast

**I `Admin.tsx`:** Lägg till en `useEffect` med 30-sekunders intervall som automatiskt sparar blogformulärdata till `localStorage` (under en nyckel som `blog-draft`). Vid mount, ladda eventuellt sparat utkast. Visa en diskret "Draft auto-saved" toast. Rensa `localStorage` vid lyckad publicering/sparning.

Inga databasändringar behövs — allt sker lokalt.

### 3. Dark/Light mode toggle

**Approach:** Använd Tailwinds `class`-baserade dark mode (redan konfigurerat via `darkMode: ["class"]`). Dark är standard (nuvarande tema). Light mode kräver en ny uppsättning CSS-variabler.

**Ändringar:**

- **`src/index.css`:** Lägg till en `.light`-klass (eller ta bort dark-klassen) med ljusa CSS-variabelvärden (ljus bakgrund, mörk text, anpassade primary/accent-färger).

- **Ny hook `src/hooks/useTheme.tsx`:** Hanterar tema-state i `localStorage`, applicerar/tar bort `dark`-klassen på `<html>`. Standard: dark.

- **`src/components/Header.tsx`:** Lägg till en Sun/Moon-ikon-knapp som togglar tema via `useTheme`.

### Ändringsöversikt

| Fil | Ändring |
|-----|---------|
| `src/pages/Admin.tsx` | useEffect cleanup för overflow + autosave-logik med localStorage |
| `src/index.css` | Ljusa CSS-variabler under `:root` (utan dark-klass) |
| `src/hooks/useTheme.tsx` | Ny — tema-hantering med localStorage |
| `src/components/Header.tsx` | Theme toggle-knapp |
| `tailwind.config.ts` | Ingen ändring (darkMode redan konfigurerat) |

