# AGENTS.md

This repo is the advanced frontend seed for `ai-sales-assistant-crm`. Follow these instructions for all Codex and OpenCode work in this project.

## Product Direction

- Build a premium AI sales assistant CRM for pipeline management, lead intelligence, conversation coaching, account planning, and sales operations.
- Prefer operational product screens over marketing pages. The first screen should feel useful to a sales operator, manager, or founder.
- Keep visual quality high: dense but readable layouts, restrained surfaces, strong hierarchy, complete interaction states, and meaningful CRM data.

## Tech Stack

- Vite + React + TypeScript.
- Tailwind CSS v4 with CSS variables and project tokens.
- shadcn/ui-style local components in `src/components/ui`.
- TanStack React Query for server/cache state.
- React Router for page routing.
- Lucide React for icons.

## Code Rules

- Keep route-level screens in `src/routes`.
- Keep reusable UI primitives in `src/components/ui`.
- Keep app-specific composed components in `src/components`.
- Use semantic component names and stable mock data names that map to CRM concepts.
- Avoid long one-off `className` strings. Prefer local components, variants, and semantic CSS classes.
- Use `cn` from `src/lib/utils.ts` when composing classes.
- Do not hard-code brand colors in JSX. Add or reuse CSS variables in `src/styles.css`.

## Design Rules

- Read `docs/ai/design-system.md` before major UI work.
- CRM screens should favor clarity, scanning, comparison, and repeated use.
- Use cards only for individual panels, repeated records, dialogs, and tool surfaces.
- Do not nest UI cards inside other cards.
- Use icons for actions when a familiar Lucide icon exists.
- Provide loading, empty, disabled, hover, focus, and error states when adding real workflows.

## AI Workflow

- Use `.agents/skills/frontend-design` for any visual redesign or new screen.
- Use `.agents/skills/shadcn-ui` when adding or changing UI primitives.
- Use `.agents/skills/crm-product-patterns` when adding CRM entities or workflows.
- Use `.agents/skills/data-query-routing` when adding routes, queries, or mutations.
- Use `.agents/skills/frontend-qa` before finishing frontend work.

## Verification

Run the strongest available checks after changes:

```bash
npm run lint
npm run build
```

For visible UI changes, also run the app locally and inspect desktop and mobile widths.
