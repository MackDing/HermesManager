# Dashboard page — overrides MASTER

**Purpose:** "What's happening right now?" answered in <3 seconds.

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [StatCard] [StatCard] [StatCard] [StatCard]                    │ ← 4 cards, grid-cols-4
│  running    completed  failed     policy                         │   tight on mobile -> grid-cols-2
│  12         247        3          8                              │
├─────────────────────────────────────────────────────────────────┤
│  Tasks per minute (24h)                              [▼ 24h]     │ ← line chart, full width
│  [line chart — recharts LineChart, 240px tall]                   │
├───────────────────────────────┬─────────────────────────────────┤
│  Active tasks          (12)   │  Task distribution by runtime    │
│  [dense table, virtualized]   │  [donut chart]                   │
│  task_id  skill  runtime  ... │  local  ████     43%             │
│                               │  docker ██       22%             │
│                               │  k8s    ██████   35%             │
└───────────────────────────────┴─────────────────────────────────┘
```

## Stat Card spec

```tsx
<article className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-[var(--color-fg-muted)] uppercase tracking-wide">Running</span>
    <Play className="w-4 h-4 text-[var(--color-info)]" />
  </div>
  <div className="mt-2 text-2xl font-semibold text-[var(--color-fg)] font-mono tabular">12</div>
  <div className="mt-1 text-xs text-[var(--color-fg-muted)]">
    <TrendingUp className="inline w-3 h-3" /> <span className="text-[var(--color-success)]">+2</span> in last hour
  </div>
</article>
```

- All numbers: `font-mono` + `tabular-nums` (MASTER §3 rule)
- Icon color MUST match the semantic meaning of the card (info/success/error/warning)
- Trend indicator (up/down) in the muted footer — subtle, never dominant

## Line chart spec

- Recharts `<LineChart>` with a single line
- X-axis: 24 tick marks (every hour); Y-axis: auto-scaled
- Line color: `var(--color-accent)`, width 2px, no dots
- Active dot on hover only: 5px circle, `var(--color-primary)`
- Tooltip: dark surface, white text, shows exact timestamp + value
- Height: 240px fixed (don't let it grow)
- `<ResponsiveContainer>` for width
- Loading: skeleton block (`var(--color-bg-subtle)`), NOT a spinner

## Active tasks table

- Virtualized if `count > 50`
- Columns: **Task ID** (mono, truncated to 8 chars + tooltip full), **Skill**, **Runtime** (colored badge), **Started** (relative: "2m ago"), **Status badge**
- Row click: navigate to `/events?task=<id>` (filtered view)
- Update mechanism: WebSocket if available, else polling every 5s (disable when tab inactive via `document.visibilityState`)

## Empty state

If no tasks have ever run:
```
[Boxes icon, 32px, muted color]
No tasks yet
Submit your first task via Slack (/hermes run hello-skill) or the API.
[Secondary button: "View example curl"]
```

Never an empty table. Never a blank chart frame. Always a useful next action.

## Keyboard shortcuts

- `j`/`k`: move selection up/down in active tasks table
- `Enter`: open selected task in Events view
- `r`: manual refresh (for users who don't trust the auto-update)
- `?`: show shortcut help modal

Shortcuts are ops-tool table stakes. k9s, Linear, Superhuman — every tool ops people love has them.

## Anti-patterns specific to this page

- No "welcome back, [name]" message — ops tools don't greet
- No huge hero numbers animating up from 0 — just render the value
- No live-updating counter that rebuilds 60x/second — throttle to 1Hz max
- No animated line-draw on chart load — chart should be fully rendered immediately
