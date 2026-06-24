# Testing And Review

## Standard Checks

Run these before finishing normal frontend work:

```bash
npm run lint
npm run build
```

## Visual Checks

For visible UI changes:

- Inspect desktop around 1440px width.
- Inspect tablet around 900px width.
- Inspect mobile around 390px width.
- Check hover, focus, disabled, loading, and empty states when the feature includes them.
- Verify text does not overlap or overflow cards, buttons, controls, or metric tiles.

## Review Focus

- Does the screen show real CRM intent?
- Are data labels specific enough for sales teams?
- Can a user scan the hierarchy in five seconds?
- Are future API boundaries clear?
- Did the change avoid unrelated refactors?

## Finishing Notes

When reporting work, mention the files changed, the checks run, and any checks that could not be run.
