---
name: shadcn-ui
description: "Use when adding, editing, or reviewing UI primitives, shadcn/ui-style components, Tailwind CSS v4 styling, CSS variables, component variants, icons, forms, buttons, dialogs, cards, tabs, tables, or reusable CRM interface components in this React app."
---

# Shadcn UI

Use this skill for reusable UI work in AI Sales Assistant Pro.

## Workflow

1. Inspect `components.json`, `src/styles.css`, and nearby components before editing.
2. Prefer shadcn/ui-style local primitives in `src/components/ui`.
3. Use Lucide React icons for familiar actions.
4. Use `cn` from `src/lib/utils.ts` for class composition.
5. Keep styling token-driven. Add CSS variables in `src/styles.css` before introducing new brand colors.
6. Keep component APIs small: `variant`, `size`, `isLoading`, and explicit semantic props are usually enough.
7. Run `npm run lint` and `npm run build` when implementation changes are complete.

## Tailwind Rules

- Use Tailwind v4 utilities for layout and state styling.
- Avoid long one-off JSX class strings. Extract a primitive, composed component, or semantic CSS class.
- Do not hard-code hex colors in JSX.
- Do not introduce nested cards unless the inner surface is a true control, dialog, or repeated item.
- Use stable dimensions for icon buttons, metric tiles, avatars, and compact controls.

## Component Quality

- Include hover, focus-visible, disabled, and loading states where relevant.
- Ensure text fits inside buttons, badges, cards, table cells, and form controls.
- Use accessible labels for icon-only controls.
- Keep primitives visually neutral enough to work across login, dashboard, lead detail, settings, and pipeline screens.
