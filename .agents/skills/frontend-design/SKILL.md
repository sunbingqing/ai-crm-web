---
name: frontend-design
description: "Use when designing, redesigning, or reviewing visible frontend screens, CRM dashboards, login pages, product surfaces, responsive layouts, visual hierarchy, color systems, typography, spacing, or interaction states for AI Sales Assistant Pro."
---

# Frontend Design

Use this skill to make CRM screens polished, practical, and consistent.

## Required Context

Read these files before major design work:

- `docs/ai/design-system.md`
- `docs/ai/frontend-standards.md`

Read `docs/ai/crm-domain.md` when the screen includes CRM entities, AI recommendations, sales workflows, pipeline data, or account intelligence.

## Design Workflow

1. Identify the user's primary workflow and the CRM object being manipulated.
2. Define hierarchy: page identity, primary action, key metrics, work queue, supporting context.
3. Use dense but readable product layout. Avoid marketing-page composition unless explicitly requested.
4. Use cards only for real panels, records, dialogs, or tool surfaces.
5. Use CRM-specific data labels, not generic filler.
6. Include states that a user would naturally expect: loading, empty, error, disabled, hover, focus, and selected where relevant.
7. Check desktop and mobile layouts before finishing.

## Visual Guardrails

- Prefer calm neutral surfaces with multiple accent colors for status and workflow meaning.
- Avoid single-hue palettes, decorative blobs, oversized hero typography, and vague atmospheric visuals.
- Keep panel headings compact.
- Use icons for recognizable actions and tool affordances.
- Never let text overlap or overflow its container.
