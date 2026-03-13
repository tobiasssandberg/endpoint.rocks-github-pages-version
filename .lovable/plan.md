

## Plan: GDPR Cookie-consent-banner

En cookie-banner som visas för nya besökare och låter dem acceptera eller neka Google Analytics-tracking.

### Hur det fungerar

1. **Ny komponent `CookieConsent.tsx`**
   - Visas längst ner på sidan som en snygg, mörk banner med texten "Vi använder cookies för att analysera trafiken" (eller liknande)
   - Två knappar: **Acceptera** och **Neka**
   - Sparar valet i `localStorage` (t.ex. `cookie-consent: accepted/declined`)
   - Visas inte igen om användaren redan gjort ett val

2. **Villkorad GA4-laddning i `index.html` + `App.tsx`**
   - Flytta GA4-scriptet från att alltid laddas till att laddas dynamiskt via JavaScript
   - Scriptet laddas bara om `localStorage.getItem("cookie-consent") === "accepted"`
   - Om användaren nekar: inga GA4-scripts laddas, inga cookies sätts
   - `RouteChangeTracker` skickar bara events om consent finns

3. **Ändra val**
   - Liten länk i footern: "Cookie-inställningar" som öppnar bannern igen

### Filändringar
- **Ny:** `src/components/CookieConsent.tsx` — banner-komponent
- **Ändra:** `index.html` — ta bort statisk GA4-script (laddas dynamiskt istället)
- **Ändra:** `src/App.tsx` — importera CookieConsent, villkora RouteChangeTracker
- **Ändra:** `src/components/Footer.tsx` — lägg till "Cookie-inställningar"-länk

