

## Problem

`gtag()` i `CookieConsent.tsx` definieras som:
```js
window.gtag = function (...args: unknown[]) {
  window.dataLayer!.push(args); // pushes an ARRAY wrapping args
};
```
Googles officiella snippet gör:
```js
function gtag(){dataLayer.push(arguments);} // pushes the Arguments object directly
```

`push(args)` (en array) ≠ `push(arguments)` (Arguments-objekt). GA kräver det senare formatet för att korrekt tolka event-typ och parametrar.

## Plan

### 1. Flytta GA-skriptet till `index.html`

Lägg till Googles exakta officiella snippet i `<head>` i `index.html`, före alla andra skript:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ETF88872KS"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ETF88872KS');
</script>
```

### 2. Förenkla `CookieConsent.tsx`

- Ta bort `loadGA()`, `initGA()`, `removeGACookies()` och `getConsent()` — de behövs inte längre.
- Behåll bara banner-komponenten som visar informationsmeddelandet och "Got it!"-knappen.

### 3. Rensa `App.tsx`

- Ta bort `import { initGA }` och `initGA()`-anropet.
- `RouteChangeTracker` behålls — den använder `window.gtag` som nu definieras globalt i HTML:en.
- Uppdatera `window.gtag`-typdeklarationen till `(...args: any[]) => void` för att matcha.

### Filer som ändras
- `index.html` — lägg till GA-snippet
- `src/components/CookieConsent.tsx` — förenkla till bara banner
- `src/App.tsx` — ta bort `initGA`-import och anrop

