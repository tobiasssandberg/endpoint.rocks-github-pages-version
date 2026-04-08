

## Engelsk rättstavning i bloggeditorn

Webbläsare har inbyggd stavningskontroll som aktiveras via HTML-attributen `spellcheck="true"` och `lang="en"`. Dessa behöver sättas på textarean i Markdown-editorn.

### Ändring

**`src/components/MarkdownEditor.tsx`** — Uppdatera `textareaProps` i `MDEditor`-komponenten:

```tsx
textareaProps={{
  spellCheck: true,
  lang: "en",
  onPaste: (e: any) => handlePaste(e),
}}
```

En ändring, en fil. Webbläsaren hanterar resten — röda understrykningar visas under felstavade ord med förslag vid högerklick.

