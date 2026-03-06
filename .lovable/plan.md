

## Plan: Add animations to blog cards and blog post page

Use CSS animations (already configured in tailwind) instead of adding framer-motion as a new dependency — keeps the bundle smaller and follows existing patterns.

### Changes

1. **`src/components/BlogSection.tsx`** — Add staggered fade-in animations to blog cards
   - Add `animate-fade-in` class to each card with increasing `animation-delay` via inline style
   - Add `opacity-0` initial state so cards fade in on render

2. **`src/pages/BlogPost.tsx`** — Add fade-in animation to article content
   - Add `animate-fade-in` to the article wrapper, back-link, and image

3. **`tailwind.config.ts`** — Ensure `fade-in` keyframe and animation are defined (add if missing since current config only has accordion animations)

4. **`src/index.css`** — Add `animation-fill-mode: forwards` utility if needed for the opacity trick

