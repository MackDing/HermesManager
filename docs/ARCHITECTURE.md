# Architecture

HermesManager is a control plane for Hermes Agent fleets. It ships as a single Go binary that embeds a React SPA, talks to PostgreSQL for all state, and dispatches agent workloads to K8s, Docker, or local processes.

## System Overview

```
                                        ┌──────────────────────────────────────────────────────┐
                                        │              hermesmanager (Go binary)                │
                                        │                                                      │
                 Slack                   │  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
                 /hermes run ──────────> │  │ REST API  │──│ Scheduler │──│ Runtime Registry │  │
                 /hermes status ───────> │  │ :8080     │  │           │  │                  │  │
                                        │  └─────┬─────┘  └─────┬─────┘  │ local  driver    │  │
                 Browser                 │        │              │        │ docker driver    │  │
                 (React SPA) ──────────> │        │              │        │ k8s    driver    │  │
                                        │  ┌─────┴─────┐  ┌─────┴──────┐ └────────┬─────────┘  │
                                        │  │  Policy   │  │   Skill    │          │            │
                                        │  │  Engine   │  │  Registry  │          │            │
                                        │  │ (YAML)    │  │ (YAML+DB)  │          │            │
                                        │  └───────────┘  └────────────┘          │            │
                                        │                                         │            │
                                        │  ┌───────────┐                          │            │
                                        │  │  Slack    │                          │            │
                                        │  │  Gateway  │                          │            │
                                        │  └───────────┘                          │            │
                                        └─────────────────────────────────────────┼────────────┘
                                                                                  │
                       ┌──────────────────────────────────────────────────────────┘
                       │
          ┌────────────┼──────────────────┬────────────────────┐
          │            │                  │                    │
    ┌─────▼──────┐  ┌──▼──────────┐  ┌───▼──────────┐  ┌─────▼──────────────────────────────┐
    │ K8s Jobs   │  │ Docker      │  │ Local        │  │ PostgreSQL 16 (CloudNativePG)      │
    │            │  │ containers  │  │ processes    │  │                                    │
    │ namespace- │  │             │  │              │  │ skills      - YAML cache           │
    │ scoped     │  │             │  │              │  │ tasks       - state machine         │
    │ label-     │  │             │  │              │  │ events      - JSONB + GIN index     │
    │ selected   │  │             │  │              │  │ agent_tokens- per-task bearer auth  │
    │ informer   │  │             │  │              │  │                                    │
    └─────┬──────┘  └──────┬──────┘  └──────┬──────┘  │ LISTEN/NOTIFY: skills_changed,     │
          │                │                │         │                policies_changed     │
          │                │                │         └────────────────────────────────────┘
          └────────────────┴────────────────┘
                           │
                    POST /v1/events
                (per-runtime callback URL)
```

## Data Flow

A task moves through these stages:

```
1. Task Submission
   Client (curl / Slack / Web UI)
     │
     ▼
2. Policy Check
   POST /v1/tasks ──> Policy Engine evaluates deny rules
     │                against {model, user, team, tool, cost}
     │                If denied: HTTP 403 + reason + rule_id
     ▼
3. Scheduler
   Picks a runtime (explicit, round-robin, or lowest-load)
     │
     ▼
4. Runtime Dispatch
   Creates workload:
     K8s:    Job + ConfigMap (task.json) + Secret (agent token)
     Docker: Container with env vars + mounted task.json
     Local:  Process with env vars + task.json on disk
     │
     ▼
5. Agent Execution
   Hermes agent reads task.json, executes skill, posts events:
     task.started ──> task.llm_call (0..N) ──> task.tool_call (0..N)
       ──> task.completed | task.failed
     │
     ▼
6. Event Callback
   POST /v1/events (Bearer token auth)
     │
     ▼
7. Audit Log
   Events written to Postgres (JSONB payload, GIN-indexed)
   Task state updated: pending -> running -> completed|failed|timeout
     │
     ▼
8. Visibility
   Web UI shows events in real time.
   Slack bot reports status on demand.
```

## Components

### API Server (`internal/api/`)

HTTP router built on Go 1.22 `net/http` ServeMux with method-aware routing. Endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/healthz` | Readiness/liveness probe |
| GET | `/v1/skills` | List all registered skills |
| GET | `/v1/skills/{name}` | Get skill detail |
| POST | `/v1/tasks` | Submit a new task |
| GET | `/v1/tasks` | List tasks (filterable by state) |
| GET | `/v1/tasks/{id}` | Get task detail |
| POST | `/v1/events` | Agent callback endpoint |
| GET | `/v1/events` | Query audit log |

The React SPA is served as embedded static files from the root path.

### Scheduler (`internal/scheduler/`)

Routes tasks to runtime backends. Selection policies:

- **Explicit**: task specifies `runtime: "k8s"` (or docker, local)
- **Round-robin**: cycles through all registered runtimes
- **Lowest-load**: queries `Status()` on each runtime, picks the one with the lowest active/capacity ratio

The scheduler updates task state to `running` after successful dispatch and depends on the `Store` interface (never raw database connections).

### Policy Engine (`internal/policy/`)

Hand-rolled YAML evaluator. Loads rules from a YAML file at startup and reloads on Postgres LISTEN/NOTIFY (`policies_changed` channel) or SIGHUP.

Rule structure:
```yaml
rules:
  - id: block-gpt4-free-tier
    action: deny
    conditions:
      model: gpt-4
      team: free-tier
```

Condition fields: `model`, `user`, `team`, `tool`, `cost_usd`. A request is denied if ANY deny rule matches all its conditions. Empty conditions match everything.

Why YAML instead of OPA/Rego: OPA adds 20+ MB to the binary and forces Rego learning on contributors. The hand-rolled evaluator covers v0.1 needs. Migration to OPA is a swap behind the `PolicyEngine` interface shape, not a rewrite.

### Runtime Drivers (`internal/runtime/`)

Each driver implements the `Runtime` interface:

```go
type Runtime interface {
    Name() string
    CallbackURL() string
    Dispatch(ctx context.Context, task storage.Task, skill storage.Skill) (Handle, error)
    Status(ctx context.Context) (int, int, error)
}
```

Drivers register via `init()` functions using a global plugin registry. Adding a new runtime never requires modifying `main.go`.

**Local** (`internal/runtime/local/`): Spawns an OS process. Monitors exit code. Callback URL: `http://127.0.0.1:{PORT}/v1/events`.

**Docker** (`internal/runtime/docker/`): Creates a container via the Docker daemon socket. Callback URL: `http://host.docker.internal:{PORT}/v1/events`.

**K8s** (`internal/runtime/k8s/`): Creates a K8s Job with a ConfigMap (task definition) and a Secret (agent bearer token with `ownerReferences` on the Job for automatic cleanup). Uses a namespace-scoped, label-selected informer (`hermesmanager.io/managed=true`) to detect Job completion/failure without leaking unrelated cluster events. Callback URL: `http://hermesmanager.{NAMESPACE}.svc.cluster.local:8080/v1/events`.

### Slack Gateway (`internal/gateway/slack/`)

HTTP handler for Slack slash commands:

- `/hermes status` -- returns task counts grouped by state
- `/hermes run <skill_name> <json_params>` -- creates a task

Depends on `Store` for task creation and skill lookup.

### React SPA (`web/`)

React 19 single-page application. Three screens:

- **Dashboard**: task counts, recent activity
- **Skills**: read-only list and detail view of registered skills
- **Events**: filterable audit log viewer

Built assets are embedded into the Go binary via `embed.FS`. No separate deployment artifact.

## Database Schema

PostgreSQL 16+, managed via CloudNativePG in K8s deployments. Schema defined in `internal/storage/migrations/001_init.up.sql`.

### Tables

**skills** -- Cache of YAML skill definitions. Primary key: `name`. YAML files are the source of truth; the DB is a query cache.

**tasks** -- Task lifecycle. State machine: `pending -> running -> completed | failed | timeout`. Foreign key to `skills.name`. Indexed on `state`, `created_at`, `skill_name`.

**events** -- Audit log. JSONB `payload` column with a GIN index (`jsonb_path_ops`) for efficient queries like `payload @> '{"model": "gpt-4o-mini"}'`. Foreign key to `tasks.id`. Indexed on `task_id`, `type`, `created_at`.

**agent_tokens** -- Per-task bearer tokens for callback authentication. `token_hash` stored as BYTEA (bcrypt). `revoked` flag prevents replay after task completion. Cascades on task deletion.

### Store Interface

All components depend on the `Store` interface (`internal/storage/store.go`), never on raw database connections. The interface covers skills, tasks, events, agent tokens, migration, and lifecycle. v0.1 ships a PostgreSQL implementation (`internal/storage/postgres/`). The interface is DB-agnostic to support external-managed Postgres (RDS, Cloud SQL) in v0.2+.

### Hot Reload

Skills and policies use Postgres `LISTEN/NOTIFY` channels (`skills_changed`, `policies_changed`). When a notification arrives, the control plane re-reads the source YAML directory. This works across multiple control-plane replicas without SIGHUP coordination.

## Agent API Contract

The full protocol between the control plane and running agents is documented in [AGENT_API.md](AGENT_API.md).

Summary:

- **Control plane -> agent**: Environment variables (`HERMESMANAGER_TASK_ID`, `HERMESMANAGER_CALLBACK_URL`, `HERMESMANAGER_AGENT_TOKEN`) plus a mounted `task.json` with skill name, parameters, policy context, and deadline.
- **Agent -> control plane**: JSON event POSTs to the callback URL with bearer token auth. Event types: `task.started`, `task.llm_call`, `task.tool_call`, `task.policy_blocked`, `task.completed`, `task.failed`.
- **Failure handling**: If an agent exits without reporting completion, the runtime driver (K8s informer, Docker exit check, process monitor) synthesizes a terminal event. No silent task losses.

## Design Decisions

### Why Go

The K8s ecosystem (`client-go`, `controller-runtime`) is massively more mature in Go than any alternative. A single static binary builds trust with platform engineers on sight. `embed.FS` removes the need for a separate frontend deployment. Rust was considered and rejected on K8s ecosystem depth and contributor friction, not on technical merit.

### Why PostgreSQL (not MySQL, not SQLite)

- **JSONB + GIN indexes**: The `events` table stores heterogeneous payloads. JSONB with `jsonb_path_ops` enables efficient queries (`payload @> '{"model":"gpt-4o-mini"}'`) without schema gymnastics.
- **LISTEN/NOTIFY**: Native pub/sub for hot-reloading skills and policies across multiple replicas. Replaces SIGHUP and works without an external message broker.
- **pgvector path**: A single `CREATE EXTENSION pgvector` enables semantic skill search in v0.2+ without adding a new data store.
- **CloudNativePG**: The most mature K8s operator for Postgres in 2026. Handles PVC binding, failover, readiness, and backups as CRDs, making the Helm install path boring in the best sense.
- **Driver**: `jackc/pgx/v5` (pure Go, no CGO).

### Why Monolith (not CRDs/Operator)

The thesis is operator UX, not architecture. A single binary is the fastest path to a working `helm install` demo. CRD schema changes are expensive once released, and CRD-based UIs require additional tooling (Headlamp/Lens plugin or raw `kubectl`). The monolith can be split later: adding a runtime driver or extracting a service is additive, not a rewrite.

### Why YAML Policy (not OPA)

OPA adds 20+ MB compiled into the binary and requires contributors to learn Rego. A hand-rolled YAML evaluator over structured fields (`model`, `user`, `team`, `tool`, `cost_limit`) covers v0.1's demo use cases. The evaluator sits behind an interface, so migrating to OPA is a swap, not a rewrite.

### Why Per-Task Agent Tokens (not Long-Lived Credentials)

Each task gets a unique bearer token stored as a bcrypt hash. The token is mounted into the agent environment and revoked when the task reaches a terminal state. This prevents replay attacks and eliminates the need for long-lived agent credentials. In K8s, the token Secret has `ownerReferences` on the Job, so it garbage-collects automatically.
