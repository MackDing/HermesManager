# HermesManager Design System — MASTER

**Global source of truth for the v0.1 React 19 admin SPA.**
All page-specific overrides live in `design-system/pages/<page>.md`. When building a page, read both this file and its page override (if present). Page overrides win on conflict.

Generated: 2026-04-21 from /ui-ux-pro-max + HermesManager v0.1 design doc overrides.

---

## 1. Pattern & Posture

- **Pattern:** Data-Dense Admin / Operator Console. No landing page in v0.1.
- **Target user:** Platform engineer or developer forking the codebase. Values clarity, keyboard-first operation, information density over visual flair.
- **Voice:** Boring, trustworthy, `kubectl`-adjacent. Think Linear + Grafana + ArgoCD. Not Notion, not Vercel dashboard.
- **Stance on novelty:** Zero innovation tokens spent on the UI. Conventional ops-tool shape = instant trust for the target audience.

## 2. Theme System (light + dark, both first-class)

Both themes ship in v0.1. Default to `prefers-color-scheme`; expose user-togglable theme in top-right nav, persist to `localStorage.hmTheme`.

Implementation: CSS custom properties on `:root` and `[data-theme="dark"]`, toggled via a single attribute on `<html>`. No theme-specific React components.

```css
:root {
  /* Light theme (default) */
  --color-bg:          #F8FAFC; /* slate-50 */
  --color-bg-elevated: #FFFFFF;
  --color-bg-subtle:   #F1F5F9; /* slate-100 */
  --color-border:      #E2E8F0; /* slate-200 */
  --color-border-strong: #CBD5E1; /* slate-300 */

  --color-fg:          #0F172A; /* slate-900 */
  --color-fg-muted:    #475569; /* slate-600 */
  --color-fg-subtle:   #94A3B8; /* slate-400 */

  --color-primary:     #0F172A; /* slate-900 — buttons, links */
  --color-primary-fg:  #FFFFFF;
  --color-accent:      #3B82F6; /* blue-500 — interactive highlights */

  /* Semantic status (same values both themes; contrast handled via outline/badge bg) */
  --color-success:     #16A34A; /* green-600 (muted, not 500) */
  --color-success-bg:  #DCFCE7; /* green-100 */
  --color-warning:     #D97706; /* amber-600 */
  --color-warning-bg:  #FEF3C7; /* amber-100 */
  --color-error:       #DC2626; /* red-600 */
  --color-error-bg:    #FEE2E2; /* red-100 */
  --color-info:        #0284C7; /* sky-600 */
  --color-info-bg:     #E0F2FE; /* sky-100 */

  /* Runtime-specific (used in tags/badges on the Dashboard) */
  --color-runtime-local:  #7C3AED; /* violet-600 */
  --color-runtime-docker: #0EA5E9; /* sky-500 */
  --color-runtime-k8s:    #2563EB; /* blue-600 */
}

[data-theme="dark"] {
  --color-bg:          #0F172A; /* slate-900 */
  --color-bg-elevated: #1E293B; /* slate-800 */
  --color-bg-subtle:   #0B1220; /* custom — slightly deeper than bg */
  --color-border:      #334155; /* slate-700 */
  --color-border-strong: #475569; /* slate-600 */

  --color-fg:          #F8FAFC; /* slate-50 */
  --color-fg-muted:    #94A3B8; /* slate-400 */
  --color-fg-subtle:   #64748B; /* slate-500 */

  --color-primary:     #F8FAFC; /* invert */
  --color-primary-fg:  #0F172A;
  --color-accent:      #60A5FA; /* blue-400 — lighter in dark */

  --color-success:     #22C55E; /* green-500 (brighter for dark contrast) */
  --color-success-bg:  #052E16; /* green-950 */
  --color-warning:     #F59E0B; /* amber-500 */
  --color-warning-bg:  #422006; /* amber-950 */
  --color-error:       #EF4444; /* red-500 */
  --color-error-bg:    #450A0A; /* red-950 */
  --color-info:        #38BDF8; /* sky-400 */
  --color-info-bg:     #082F49; /* sky-950 */

  --color-runtime-local:  #A78BFA; /* violet-400 */
  --color-runtime-docker: #38BDF8; /* sky-400 */
  --color-runtime-k8s:    #60A5FA; /* blue-400 */
}
```

**Contrast verification (do before merging any CSS):**
- `--color-fg` on `--color-bg` ≥ 7:1 (AAA) in both themes
- `--color-fg-muted` on `--color-bg` ≥ 4.5:1 (AA) in both themes
- All semantic bg/fg pairs ≥ 4.5:1

## 3. Typography

- **UI sans:** `Inter` (variable font, weights 400/500/600/700 loaded)
- **Data / code / IDs:** `JetBrains Mono` (weights 400/500)
- **Why this pair:** GitHub, Vercel, Linear, Railway, Fly.io all use Inter in 2026 — platform engineers will read it as "proper dev tool." JetBrains Mono renders UUIDs, SHA hashes, and YAML cleanly.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Menlo', 'Monaco', monospace;

  --text-xs:   0.75rem;   /* 12px — metadata, secondary labels */
  --text-sm:   0.875rem;  /* 14px — table rows, secondary UI */
  --text-base: 1rem;      /* 16px — body, primary UI */
  --text-lg:   1.125rem;  /* 18px — card titles */
  --text-xl:   1.25rem;   /* 20px — page titles */
  --text-2xl:  1.5rem;    /* 24px — nothing larger than this; it's an admin tool */

  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-data: 1.35;  /* slightly tighter for tables */
}
```

**Mandatory: `font-variant-numeric: tabular-nums` on every column showing counts, IDs, timestamps, or percentages.** Without this, the Events table jitters visually on every row change. This is the #1 thing that separates "real dev tool" from "SaaS mockup."

```css
.tabular { font-variant-numeric: tabular-nums; }
code, pre, .mono, td.numeric, td.id, td.timestamp { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
```

## 4. Spacing & Density

8pt grid, but the admin uses two density levels:

- **Comfortable** (default for cards, forms, detail panels): 16 / 24 / 32 / 48 rhythm
- **Dense** (tables, log-like lists, skill list): 4 / 8 / 12 rhythm, row height 32-36px, NO row padding beyond 8px horizontal

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;    /* max. nothing rounder. no pill buttons. */

  --shadow-xs: 0 1px 0 rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.05), 0 10px 15px rgba(15, 23, 42, 0.08);
  /* No shadow-lg. This is an admin tool. */
}

[data-theme="dark"] {
  --shadow-xs: 0 1px 0 rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4), 0 10px 15px rgba(0, 0, 0, 0.3);
}
```

## 5. Icons

- **Library:** [Lucide](https://lucide.dev) (actively maintained, consistent stroke width, tree-shakeable). Import per-icon, never the full set.
- **Stroke width:** 1.5px. Do NOT mix with 2px icons.
- **Size tokens:** 16px (inline), 20px (buttons), 24px (nav), 32px (hero/empty-state). Never arbitrary sizes.
- **Never emojis.** Not in labels, not in empty states, not "just for v0.1." Emojis render differently per OS, can't be themed, and signal "not serious."

Specific icons locked for v0.1 (keeps the codebase disciplined):
- Dashboard: `LayoutDashboard`
- Skills: `BookOpen`
- Events: `ListChecks`
- Running task: `Play`
- Completed task: `CheckCircle2`
- Failed task: `XCircle`
- Policy blocked: `ShieldAlert`
- Local runtime: `Monitor`
- Docker runtime: `Container`
- K8s runtime: `Boxes`
- Slack: use official SVG (required by Slack brand guidelines)

## 6. Components

### Buttons (Tailwind + CSS vars)

```tsx
// Primary (1 per screen max — main CTA)
<button className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-primary-fg)]
                   text-sm font-medium hover:opacity-90 active:opacity-100
                   focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-150">

// Secondary
<button className="px-4 py-2 rounded-md bg-[var(--color-bg-subtle)] text-[var(--color-fg)]
                   border border-[var(--color-border)] text-sm font-medium
                   hover:bg-[var(--color-bg-elevated)] focus-visible:ring-2
                   focus-visible:ring-[var(--color-accent)]">

// Destructive (e.g. cancel running task)
<button className="px-4 py-2 rounded-md border border-[var(--color-error)] text-[var(--color-error)]
                   bg-transparent text-sm font-medium hover:bg-[var(--color-error-bg)]">

// Ghost (e.g. row actions)
<button className="px-2 py-1 rounded text-[var(--color-fg-muted)] text-sm
                   hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]">
```

Button hierarchy per screen: **1 primary, N secondaries, 0 tertiary/text-only buttons that look like links.** Ambiguity between button and link is the #1 dev-tool UX smell.

### Status badges (task state)

```tsx
const STATUS_STYLES = {
  running:   'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  completed: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  failed:    'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  timeout:   'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  blocked:   'bg-[var(--color-error-bg)] text-[var(--color-error)]',
};

<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono ${STATUS_STYLES[state]}`}>
  <Icon className="w-3 h-3" /> {state}
</span>
```

Do NOT use color alone for status. Every badge has an icon + text. (Rule: `color-not-only`.)

### Tables (the core component of this app)

- Default row height: 36px (dense)
- Zebra striping: OFF (reduces data noise)
- Hover: `bg-[var(--color-bg-subtle)]` only, no transform
- Selected: left border 2px `var(--color-accent)`
- Header: sticky, `bg-[var(--color-bg)]`, `border-b` = `var(--color-border-strong)`
- Columns: monospace for IDs/timestamps/counts, sans for descriptions
- Sort indicator: `ArrowUp`/`ArrowDown` lucide icon, `aria-sort="ascending"|"descending"`
- Virtualize when `rowCount > 100` (react-window or TanStack Virtual)
- Empty state: centered icon + one-line explanation + optional action button. NEVER blank table.
- Loading: skeleton rows (not a spinner). 6 skeleton rows max.

## 7. Motion

- **Only animate:** `opacity`, `transform`. Nothing else.
- **Durations:** 150ms hover/press, 200ms page transitions, 300ms route changes. Never > 300ms.
- **Easing:** `ease-out` for enter, `ease-in` for exit.
- **Respect `prefers-reduced-motion: reduce`** — fallback to instant changes, NOT just reduced duration.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

No loading spinner animations that rotate forever. Use skeleton placeholders for >200ms loads.

## 8. Charts (v0.1 limit: 3 chart types only)

Library: **Recharts** (React 19 compatible, tree-shakeable, good TypeScript types). Not Chart.js (imperative), not D3 (too low-level for v0.1 scope).

Three permitted chart types:

1. **Line chart** — Dashboard "tasks/minute over 24h." One line = total. No stacked series in v0.1.
2. **Sparkline** — in table rows, shows last-24h success rate per skill. 40px wide, 16px tall, no axis.
3. **Donut chart** — Dashboard "tasks by runtime" breakdown. Max 3 slices (local/docker/k8s). Percentage labels INSIDE slices, not separate legend to save space.

Chart colors: always `var(--color-runtime-*)` tokens. Grid lines: `var(--color-border)` at 50% opacity. No gradients on data. No animation on data load unless `prefers-reduced-motion: no-preference`.

## 9. Accessibility (hard gates before any PR merges)

- [ ] Contrast: body text ≥ 4.5:1, large text ≥ 3:1, in BOTH themes (verified via axe-core in CI)
- [ ] Keyboard: every interactive element reachable via Tab, in visual order, with visible focus ring
- [ ] Screen reader: every icon-only button has `aria-label`; status badges have `aria-label="Task state: running"`
- [ ] `prefers-reduced-motion` honored (media query above)
- [ ] Dynamic type: layout doesn't break at 200% browser zoom
- [ ] Tables have `<caption>` (visually hidden with `sr-only`) describing content

## 10. Layout & Responsive

- **Desktop-first is acceptable here** (v0.1 target users are ops/dev on 14"+ screens)
- Breakpoints: 1024px (min usable), 1280px (default), 1536px (comfortable)
- Below 1024px: show a "HermesManager is optimized for desktop — mobile support is on the roadmap" banner, keep content usable but don't over-engineer responsive table collapses in v0.1
- Fixed sidebar on desktop (240px), collapses to top bar on tablet

## 11. Anti-Patterns (never do these)

- Emoji icons (e.g. 🚀 "Launch", 🔧 "Settings") — use Lucide
- Gradient backgrounds on surfaces — use solid semantic colors
- Glass/blur effects — this is not a consumer app
- Pill-shaped buttons (`rounded-full` on non-badge elements)
- Animated loading spinners as the only feedback — use skeletons
- Rainbow status colors (using color to distinguish 7+ states) — group into 4-5 semantic buckets
- `display: flex` for tabular data — use actual `<table>` for accessibility
- Hover-only affordances — everything must work on click/tap too (accessibility + keyboard)
- Row click = navigate AND row has action buttons — pick one, document which
- Toast notifications for passive state changes — toasts only for user-initiated actions

## 12. Tech Stack (v0.1 frontend)

- React 19 + Vite (build tool, not Next.js — this is a static SPA embedded via `embed.FS`)
- Tailwind CSS 4 (CSS-first config, uses the variables above directly)
- TanStack Query (React Query) for server state
- TanStack Table for data tables (headless, works with our styling)
- Recharts for the 3 permitted chart types
- React Router 7 (3 routes only: `/`, `/skills`, `/events`)
- lucide-react for icons

**Do NOT include:**
- State management libraries (Zustand, Redux, Jotai) — React Query + local state covers v0.1
- UI component libraries (shadcn/ui, Radix, MUI) — write components directly against these tokens
- CSS-in-JS runtimes (styled-components, emotion) — Tailwind classes + CSS vars are enough
- Animation libraries (Framer Motion, GSAP) — CSS transitions cover the motion budget

---

## Per-page design lives in `design-system/pages/`

When building a specific page, read both this file AND its page override. Page overrides take precedence on conflict.

- `pages/dashboard.md` — Dashboard page (stat cards, line chart, active tasks)
- `pages/skills.md` — Skills list + detail
- `pages/events.md` — Events audit log (the highest-density page)
