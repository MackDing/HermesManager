# Skills page — overrides MASTER

**Purpose:** "What skills are loaded and what do they do?"

## Layout

Two-pane, desktop-native admin shape:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Search bar]                            [filter: runtime ▼]     │
├──────────────────────────┬──────────────────────────────────────┤
│  hello-skill      v0.1.0 │  hello-skill                          │
│  echo-skill       v0.2.1 │  v0.1.0 · loaded from hello.yaml      │
│  summarize-skill  v1.0.0 │  ──────────────────────────────────   │
│  > k8s-health     v0.3.0 │  Description: Greets a user by name.  │
│  fetch-url        v0.1.0 │                                        │
│  ...                     │  Parameters:                           │
│                          │  - name (string, required)             │
│                          │                                        │
│  [list: dense, 32px row] │  Required models:                      │
│                          │  - gpt-4o-mini                         │
│                          │  - claude-haiku-4-5                    │
│                          │                                        │
│                          │  Required tools: [llm]                 │
│                          │  ──────────────────────────────────   │
│                          │  Raw YAML:                             │
│                          │  [YAML syntax-highlighted, code font]  │
└──────────────────────────┴──────────────────────────────────────┘
```

- Left list: ~320px wide, scrollable, dense (32px rows)
- Right detail: flex-grow, scrollable independently
- Selected row: left border `2px solid var(--color-accent)`, bg `var(--color-bg-subtle)`

## Search

- Top of left pane. Instant filter as user types (local filter only in v0.1, no fuzzy server search)
- Placeholder: "Search by name or description…"
- Keyboard: `/` focuses search from anywhere on the page (Linear convention)
- Esc clears search + blurs input

## Detail pane

- Title: skill `name` (`text-xl font-semibold`)
- Subtitle: `version · loaded from <filename>.yaml · last reload <relative time>`
- Parameters: rendered as a small table (name | type | required | description)
- Required models/tools: list of status-style badges
- Raw YAML: code block with monospace, line numbers, syntax highlight (Shiki or Prism; small footprint wins — Shiki for React 19 has tree-shakeable themes)
- Copy-to-clipboard button in top-right of YAML block

## Empty states

- **No skills loaded:** "No skills found in /etc/hermesmanager/skills/. Mount a skills directory via the Helm chart or `--skills-dir` flag." Link to docs.
- **No search matches:** "No skills match '<query>'. Try clearing filters." Button: "Clear search."
- **No skill selected (fresh load):** detail pane shows an illustration-free state: "Select a skill to view details." No ASCII art, no emoji, just text.

## Reload indicator

When `LISTEN/NOTIFY` fires `skills_changed`, show a subtle, NON-toast indicator in the top-right: small dot + "Reloaded 4s ago." Fades to muted text after 10s. User trust signal, not an interruption.

## Anti-patterns for this page

- No "Create skill" button — v0.1 is YAML-file-driven (P3 commits to this)
- No inline YAML editor — matches the "skills are source-controlled YAML" thesis
- No drag-to-reorder — skills have no order
- No favorite/pin feature — YAGNI for v0.1

## Accessibility

- Left list is a `role="listbox"` with `aria-label="Skills"`
- Each row is `role="option"` with `aria-selected`
- Arrow keys navigate, Enter confirms selection
- Detail pane has `aria-live="polite"` so screen readers announce the new skill when selection changes
