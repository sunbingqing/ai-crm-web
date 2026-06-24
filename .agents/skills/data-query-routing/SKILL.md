---
name: data-query-routing
description: "Use when adding or changing React Router routes, route layouts, TanStack React Query hooks, query keys, mutations, cache invalidation, mock API boundaries, loading states, error states, or frontend data-flow patterns."
---

# Data Query Routing

Use this skill for application structure, navigation, and server-state behavior.

## Routing

- Put route components in `src/routes`.
- Keep shared route frames as explicit layout components.
- Make route paths stable and product-readable.
- Avoid hiding workflow state in global stores when route state, query params, or React Query state is enough.

## Query Patterns

- Use TanStack React Query for real async server state.
- Use typed query key factories when APIs are added.
- Keep mock data close to the route until it becomes shared across multiple routes.
- Model loading, error, empty, and success states for query-backed screens.
- Invalidate only the query ranges affected by a mutation.

## Boundaries

- Keep API adapters in `src/lib` or `src/features/<feature>/api.ts` when real APIs arrive.
- Keep visual components free of fetch implementation details.
- Do not add a global state library without a clear cross-route state requirement.
