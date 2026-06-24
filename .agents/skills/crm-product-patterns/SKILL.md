---
name: crm-product-patterns
description: "Use when adding or modifying CRM product concepts, sales assistant workflows, lead intelligence, account planning, pipeline management, opportunity stages, AI coaching, follow-up generation, sales activities, dashboards, or domain mock data."
---

# CRM Product Patterns

Use this skill to keep AI Sales Assistant Pro grounded in real sales operations.

## Required Context

Read `docs/ai/crm-domain.md` before designing CRM objects, workflows, mock data, labels, or AI suggestions.

## Domain Rules

- Model concrete CRM objects: lead, contact, account, opportunity, activity, conversation, playbook, signal.
- Give every AI recommendation an evidence trail, confidence level, and next action when possible.
- Keep humans in control for customer-facing sends, stage changes, and record updates.
- Use workflow language sales teams recognize: buying committee, deal health, risk reason, intent signal, next best action, forecast change.
- Prefer realistic mock data with owners, freshness, priority, status, and dates.

## Product Patterns

- Lead triage: score fit, urgency, intent, and source.
- Pipeline cockpit: show stage, value, risk, next action, and stale deals.
- Account intelligence: show signals, champions, objections, news, and expansion paths.
- Call coaching: show pre-call brief, objection handling, follow-up tasks, and transcript-derived insights.
- Manager review: show team risk, coaching moments, forecast drift, and action queues.
