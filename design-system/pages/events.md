# Events page — overrides MASTER

**Purpose:** "Show me everything that happened, let me find the bad thing." The highest-density page in the product.

## Layout

Single-column, log-style:

```
┌─────────────────────────────────────────────────────────────────┐
│  Filters: [task_id   ] [event_type ▼] [time: last 1h ▼]  [▽]   │
├─────────────────────────────────────────────────────────────────┤
│  timestamp     task_id    event            model        cost    │
├─────────────────────────────────────────────────────────────────┤
│  14:32:18.223  a3f9b2…   task.started     —             —      │
│  14:32:18.450  a3f9b2…   task.llm_call    gpt-4o-mini   $0.004 │
│  14:32:19.801  a3f9b2…   task.tool_call   web_search    —      │
│  14:32:22.103  a3f9b2…   task.llm_call    gpt-4o-mini   $0.002 │
│  14:32:22.880  a3f9b2…   task.completed   —             $0.006 │
│  14:32:25.000  c8d1e4…   task.policy_blocked  —         —      │
│  ...                                                             │
│  [virtualized list: tanstack-virtual, 28px row height]           │
└─────────────────────────────────────────────────────────────────┘
```

Row height **28px** (denser than the default table 36px — this page is the log page, density matters most).

## Column spec

| Column | Font | Width | Notes |
|--------|------|-------|-------|
| timestamp | mono, tabular | 120px | `HH:mm:ss.SSS`, group by day with sticky date header |
| task_id | mono, truncated | 96px | First 6 chars + "…"; tooltip shows full UUID; click filters to this task |
| event | mono | 180px | Colored by event type (info/success/error/warning), no icon (density) |
| model | mono | 128px | Blank for non-LLM events |
| cost | mono, tabular, right-aligned | 80px | `$0.000` precision; blank for non-LLM |
| actions | — | 32px | Row-hover-only "⋮" for "Copy JSON" / "Filter to this task" |

## Filters

- **task_id**: exact-match text input (user typically pastes a UUID from Dashboard)
- **event_type**: multi-select dropdown: all / task.started / task.llm_call / task.tool_call / task.completed / task.failed / task.policy_blocked / task.timeout
- **time**: preset ranges (last 15m / 1h / 6h / 24h / 7d / custom)
- **advanced** (▽): JSONB payload filter — `payload @> {"model": "gpt-4o"}` via a textarea; Postgres GIN index on payload handles this cheaply

Filters are URL params (`?task=a3f9b2&type=task.llm_call&since=1h`) so links are shareable. Deep-linking is mandatory per MASTER accessibility + ops-tool conventions.

## Pagination / virtualization

- Virtualized scroll (tanstack-virtual) — handle 10k+ rows in memory without performance hit
- Initial load: 500 most recent events, with "Load older" sentinel at the top of scroll
- Postgres query: `ORDER BY timestamp DESC LIMIT 500` (cursor-based pagination on older-than-timestamp)

## Real-time updates

- WebSocket stream appends new events at top with brief highlight (1s `bg-[var(--color-info-bg)]` fade)
- "Live" toggle in top-right: default ON, disable to freeze for inspection
- When scrolled away from top: show "N new events" pill that scrolls-to-top on click

## Row click / expand

- Single click on row: select it (highlight + left border)
- Click on task_id cell: filter the whole view to that task_id (most common op)
- Double-click on row or press Enter: expand inline to show full JSON payload (formatted, syntax-highlighted, copy button)
- Only one row expanded at a time

## Empty states

- **No events yet:** "No events recorded. Submit a task to see activity here."
- **Filters match nothing:** "No events match your filters." Button: "Clear filters."
- **API unreachable:** "Couldn't reach the events API." Retry button + last-known-good timestamp.

## Export

Top-right overflow menu: "Export filtered events as JSON / CSV". Streams server-side (don't hold the full dataset in browser memory). Useful for "send me the events from this incident" common ask.

## Keyboard shortcuts

- `j` / `k`: next / previous row
- `/`: focus the task_id filter
- `f`: focus the event_type filter
- `l`: toggle live mode
- `Enter`: expand row
- `Esc`: collapse expansion or clear filters (context-dependent)
- `Cmd/Ctrl + C` when row selected: copy row as JSON to clipboard

## Accessibility

- Table is a real `<table>` with `<thead>`, `<tbody>`, `<tr>`, `<td>` — not divs. Screen readers must announce column headers.
- Each row has `role="row"`, aria-selected toggles on click
- Sortable columns have `aria-sort="ascending"` | `"descending"` | `"none"`
- Live region (`aria-live="polite"`) announces new events when live mode is on, throttled to one announcement per 5s

## Anti-patterns for this page

- No pretty "recent activity" card layout — this is a log, density wins
- No grouping by task by default — flat chronological view is what ops wants during an incident
- No animation on row append beyond the 1s highlight — rows just appear
- No unread/read state — this isn't email
- No avatars, no author names — events are system-generated, naming a user would be misleading
