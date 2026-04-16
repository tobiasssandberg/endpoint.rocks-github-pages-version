

## Problem

Nested lists (sublists) in blog posts don't render properly. This is a two-part issue:

1. **Editor preview**: The `@uiw/react-md-editor` preview may not style nested lists with proper indentation
2. **Published post rendering**: The `prose prose-invert` Tailwind Typography classes should handle nested lists, but may need explicit CSS overrides to ensure proper `list-style-type` and padding at deeper nesting levels

## Plan

### 1. Add nested list CSS styles in `src/index.css`

Add styles targeting nested lists inside `.prose` containers and inside the MDEditor preview (`.w-md-editor-preview`):

- Ensure `ul`, `ol` have proper `list-style-type` and `padding-left` at each nesting level
- Ensure nested `ul ul`, `ul ol`, `ol ul`, `ol ol` get increased indentation
- Target both the blog post rendering (`.prose`) and the editor preview

### 2. Verify MDEditor tab/indent behavior

The `@uiw/react-md-editor` already supports indentation in the textarea (pressing Tab or typing spaces). Markdown nested lists work with 2-4 spaces of indentation. No editor code changes should be needed — the fix is purely CSS for rendering.

### Files to change
- **`src/index.css`** — Add nested list styles for `.prose` and `.w-md-editor-preview` containers

