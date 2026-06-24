# Frontend Standards

## Goals

- Keep the project easy for humans and AI agents to modify.
- Make visual decisions repeatable through tokens, components, and examples.
- Preserve the speed of Tailwind while avoiding hard-to-edit utility sprawl.

## Tailwind And CSS

- Use Tailwind v4 for utilities, layout helpers, and token-aware styling.
- Define project tokens in `src/styles.css` with CSS variables and Tailwind `@theme`.
- Prefer semantic classes for complex product regions, such as `auth-shell`, `cockpit-panel`, or `signal-card`.
- Avoid JSX class strings longer than a single readable line. Extract a component or CSS class instead.
- Never introduce a new raw color in JSX. Add a token or use an existing semantic utility.

## Components

- Put UI primitives in `src/components/ui`.
- Use small variant APIs for recurring component differences.
- Keep primitives unbranded enough to reuse across login, dashboard, lead detail, and settings surfaces.
- Put CRM-specific compositions in `src/components` or route files.

## Routing

- Keep route components in `src/routes`.
- Prefer route-level composition over deeply nested global state.
- Add layouts only when multiple routes share navigation, filters, or data loading.

## Data Fetching

- Use TanStack React Query for async data, cache state, mutations, and invalidation.
- Use typed query key factories when real APIs are added.
- Keep mock data close to the route until it becomes shared domain data.

## Accessibility

- Every input needs a label.
- Every icon-only button needs an accessible label.
- Preserve visible focus states.
- Do not encode state only through color.
