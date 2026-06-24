---
name: frontend-qa
description: "Use before finishing frontend work, especially visible UI changes, React component changes, route changes, CSS/Tailwind changes, shadcn/ui primitive updates, responsive layout work, or accessibility-sensitive forms and controls."
---

# Frontend QA

Use this skill before delivering frontend changes.

## Required Context

Read `docs/ai/testing-and-review.md` before broad or visible UI changes.

## Checklist

1. Run `npm run lint` when dependencies are installed.
2. Run `npm run build` when dependencies are installed.
3. Inspect desktop and mobile layouts for visible UI changes.
4. Verify text does not overlap or overflow.
5. Check keyboard focus and accessible labels for forms and icon buttons.
6. Confirm CRM labels and mock data are specific enough to be useful.
7. Report checks run and any checks that could not run.

## Visual Risks To Catch

- Buttons resizing because labels or icons are unstable.
- Cards nested inside cards without functional reason.
- Dark text on dark surfaces or weak contrast in badges.
- Utility-class drift that duplicates an existing primitive.
- Generic placeholder data that makes a CRM screen feel fake.
