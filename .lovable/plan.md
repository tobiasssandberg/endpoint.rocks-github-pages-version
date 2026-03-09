

# Endpoint.rocks – Redesign

## Översikt
En modern, mörk tech-sajt som fungerar som en kuraterad katalog över community-verktyg för Microsoft Intune. Med sökfunktion, kategorifilter, databasdriven innehållshantering och bloggvisning via RSS.

---

## 1. Design & Visuellt tema
- **Mörkt tema** med polerad, professionell känsla – mörka bakgrunder, subtila gradienter och glödande accentfärger (gult/guld som nuvarande logotyp)
- Responsiv design som fungerar bra på desktop, tablet och mobil
- Snygga kort-baserade layouter för verktygen istället för dagens knappar
- Smooth hover-animationer och övergångar

## 2. Startsida / Hero
- Hero-sektion med "Endpoint.rocks"-branding och tagline: *"Your gateway to the best community tools for Microsoft Intune"*
- Sökfält direkt i hero-sektionen så besökare kan börja söka direkt
- Kategori-knappar/tabs under sökfältet för snabbfiltrering

## 3. Verktygskatalog
- **Sökfunktion** – Fritextsökning som filtrerar verktyg i realtid
- **Kategorifilter** – Klickbara kategorier (Management Tools & Scripts, Solutions, Tools for Documentation, Application Management)
- Varje verktyg visas som ett **kort** med namn, kort beskrivning och länk till GitHub/webbsida
- Kategori-badge på varje kort

## 4. Databas (Supabase/Lovable Cloud)
- Tabell för **verktyg** med fält: namn, beskrivning, URL, kategori
- Alla verktyg hämtas från databasen, så du kan lägga till/redigera via Supabase utan kodändring
- Befintliga verktyg migreras in i databasen

## 5. Blogg-sektion
- Visa senaste blogginlägg genom att hämta RSS-flödet från endpoint.rocks/feed/
- Visar titel, datum och eventuell bild
- "Läs mer"-länk till den fullständiga artikeln på WordPress

## 6. Navigation & Footer
- Sticky header med logotyp, navigation (Community Tools, Blogg) 
- Footer med disclaimer-text och eventuella sociala länkar

