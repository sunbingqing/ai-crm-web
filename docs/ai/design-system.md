# Design System

## Product Feel

AI Sales Assistant Pro should feel like a serious operating system for revenue teams: precise, calm, modern, and fast. It should look more premium than the earlier CRM while staying work-focused.

## Visual Principles

- Lead with the product interface, not a marketing hero.
- Use quiet surfaces, crisp borders, and useful density.
- Make the next action obvious for sales reps and managers.
- Prefer real CRM objects, metrics, and workflow states over decorative copy.
- Avoid one-note palettes. Mix neutral foundations with teal, blue, amber, green, and rose accents.

## Layout

- Use full-width sections or unframed layouts for page structure.
- Use cards for focused panels such as sign-in, activity queues, pipeline slices, and account signals.
- Keep card radius at 8px or less unless a component primitive already requires otherwise.
- Use stable dimensions for toolbars, metric tiles, avatar stacks, forms, and tables.
- Check narrow widths so labels, buttons, and metrics do not overlap.

## Typography

- Use the system font stack.
- Do not scale font size with viewport width.
- Keep letter spacing at `0`.
- Use compact headings inside panels; reserve large type for page-level identity.

## Components

- Buttons: use icon + label for primary product actions.
- Icon buttons: use Lucide icons and accessible labels.
- Forms: labels above fields, compact helper text, visible invalid states.
- Segmented controls: use for modes such as password login, SSO, pipeline view, or owner scope.
- Tables and lists: show status, owner, next action, and freshness.
- Empty states: state what is missing and offer one clear action.

## Color Tokens

- `--background`: app canvas.
- `--surface`: elevated panels.
- `--surface-muted`: quiet grouped areas.
- `--foreground`: primary text.
- `--muted-foreground`: secondary text.
- `--primary`: main action color.
- `--accent-teal`, `--accent-amber`, `--accent-rose`, `--accent-green`: workflow accents.

## Motion

- Use motion sparingly for hover affordances, progress indicators, and changing signal states.
- Avoid decorative floating shapes.
