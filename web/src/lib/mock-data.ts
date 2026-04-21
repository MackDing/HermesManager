/* Mock data for HermesManager v0.1 SPA */

export type TaskStatus = 'running' | 'completed' | 'failed' | 'timeout' | 'blocked';
export type Runtime = 'local' | 'docker' | 'k8s';

export type EventType =
  | 'task.started'
  | 'task.llm_call'
  | 'task.tool_call'
  | 'task.completed'
  | 'task.failed'
  | 'task.policy_blocked'
  | 'task.timeout';

export interface StatCard {
  label: string;
  value: number;
  trend: number;
  trendLabel: string;
  status: 'info' | 'success' | 'error' | 'warning';
}

export interface ActiveTask {
  taskId: string;
  skill: string;
  runtime: Runtime;
  startedAt: Date;
  status: TaskStatus;
}

export interface ChartDataPoint {
  hour: string;
  tasksPerMinute: number;
}

export interface RuntimeDistribution {
  runtime: Runtime;
  count: number;
  percentage: number;
}

export interface Skill {
  name: string;
  version: string;
  filename: string;
  lastReload: Date;
  description: string;
  parameters: SkillParameter[];
  requiredModels: string[];
  requiredTools: string[];
  runtime: Runtime;
  yaml: string;
}

export interface SkillParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface EventRecord {
  id: string;
  timestamp: Date;
  taskId: string;
  eventType: EventType;
  model: string | null;
  cost: number | null;
  payload: Record<string, unknown>;
}

/* ---------- Dashboard mock data ---------- */

export const statCards: StatCard[] = [
  { label: 'Running', value: 12, trend: 2, trendLabel: 'in last hour', status: 'info' },
  { label: 'Completed', value: 247, trend: 18, trendLabel: 'in last hour', status: 'success' },
  { label: 'Failed', value: 3, trend: -1, trendLabel: 'vs prev hour', status: 'error' },
  { label: 'Policy Blocked', value: 8, trend: 3, trendLabel: 'in last hour', status: 'warning' },
];

export const activeTasks: ActiveTask[] = [
  { taskId: 'a3f9b2c1-8d4e-4f1a-b6c7-2e9d3f0a1b5c', skill: 'summarize-url', runtime: 'docker', startedAt: new Date(Date.now() - 120_000), status: 'running' },
  { taskId: 'b7e4d8f2-1c3a-4e6b-9d2f-5a8c7b0e3d1f', skill: 'k8s-health', runtime: 'k8s', startedAt: new Date(Date.now() - 45_000), status: 'running' },
  { taskId: 'c1d5e9a3-6b2f-4c8d-a7e1-3f0b9c4d2e6a', skill: 'hello-skill', runtime: 'local', startedAt: new Date(Date.now() - 300_000), status: 'running' },
  { taskId: 'd4f8a2b6-9e3c-4d7a-b1f5-8c2d6e0a4b9f', skill: 'fetch-url', runtime: 'docker', startedAt: new Date(Date.now() - 180_000), status: 'running' },
  { taskId: 'e6a1c3d7-2b4f-4e9c-d8a2-1f5b7c0e9d3a', skill: 'echo-skill', runtime: 'local', startedAt: new Date(Date.now() - 60_000), status: 'running' },
  { taskId: 'f9b2d4e8-3c5a-4f1b-e6c9-2d7a8b0f1e4c', skill: 'summarize-url', runtime: 'k8s', startedAt: new Date(Date.now() - 240_000), status: 'running' },
  { taskId: '1a3b5c7d-9e2f-4a6b-c8d1-3e5f7a9b0c2d', skill: 'k8s-health', runtime: 'k8s', startedAt: new Date(Date.now() - 30_000), status: 'running' },
  { taskId: '2b4c6d8e-1f3a-4b7c-d9e2-4f6a8b0c1d3e', skill: 'hello-skill', runtime: 'local', startedAt: new Date(Date.now() - 90_000), status: 'running' },
  { taskId: '3c5d7e9f-2a4b-4c8d-e1f3-5a7b9c0d2e4f', skill: 'fetch-url', runtime: 'docker', startedAt: new Date(Date.now() - 150_000), status: 'running' },
  { taskId: '4d6e8f0a-3b5c-4d9e-f2a4-6b8c0d1e3f5a', skill: 'echo-skill', runtime: 'local', startedAt: new Date(Date.now() - 75_000), status: 'running' },
  { taskId: '5e7f9a1b-4c6d-4e0f-a3b5-7c9d1e2f4a6b', skill: 'summarize-url', runtime: 'docker', startedAt: new Date(Date.now() - 210_000), status: 'running' },
  { taskId: '6f8a0b2c-5d7e-4f1a-b4c6-8d0e2f3a5b7c', skill: 'k8s-health', runtime: 'k8s', startedAt: new Date(Date.now() - 15_000), status: 'running' },
];

function generateChartData(): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600_000);
    const hh = hour.getHours().toString().padStart(2, '0');
    points.push({
      hour: `${hh}:00`,
      tasksPerMinute: Math.floor(Math.random() * 8) + 2,
    });
  }
  return points;
}

export const chartData: ChartDataPoint[] = generateChartData();

export const runtimeDistribution: RuntimeDistribution[] = [
  { runtime: 'local', count: 43, percentage: 43 },
  { runtime: 'docker', count: 22, percentage: 22 },
  { runtime: 'k8s', count: 35, percentage: 35 },
];

/* ---------- Skills mock data ---------- */

export const skills: Skill[] = [
  {
    name: 'hello-skill',
    version: 'v0.1.0',
    filename: 'hello.yaml',
    lastReload: new Date(Date.now() - 600_000),
    description: 'Greets a user by name. Useful for testing connectivity and basic LLM calls.',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'The name to greet' },
    ],
    requiredModels: ['gpt-4o-mini', 'claude-haiku-4-5'],
    requiredTools: ['llm'],
    runtime: 'local',
    yaml: `name: hello-skill
version: v0.1.0
description: Greets a user by name.

parameters:
  - name: name
    type: string
    required: true
    description: The name to greet

models:
  - gpt-4o-mini
  - claude-haiku-4-5

tools:
  - llm

steps:
  - action: llm.chat
    model: gpt-4o-mini
    prompt: "Say hello to {{name}} in a friendly way."`,
  },
  {
    name: 'echo-skill',
    version: 'v0.2.1',
    filename: 'echo.yaml',
    lastReload: new Date(Date.now() - 300_000),
    description: 'Echoes back the input message. Used for integration testing and connectivity checks.',
    parameters: [
      { name: 'message', type: 'string', required: true, description: 'Message to echo back' },
    ],
    requiredModels: [],
    requiredTools: [],
    runtime: 'local',
    yaml: `name: echo-skill
version: v0.2.1
description: Echoes back the input message.

parameters:
  - name: message
    type: string
    required: true
    description: Message to echo back

steps:
  - action: echo
    value: "{{message}}"`,
  },
  {
    name: 'summarize-url',
    version: 'v1.0.0',
    filename: 'summarize-url.yaml',
    lastReload: new Date(Date.now() - 1_200_000),
    description: 'Fetches a URL and produces a concise summary using an LLM. Supports HTML and plain text.',
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'URL to fetch and summarize' },
      { name: 'max_length', type: 'integer', required: false, description: 'Maximum summary length in words' },
    ],
    requiredModels: ['gpt-4o-mini'],
    requiredTools: ['llm', 'web_fetch'],
    runtime: 'docker',
    yaml: `name: summarize-url
version: v1.0.0
description: Fetches a URL and produces a concise summary.

parameters:
  - name: url
    type: string
    required: true
    description: URL to fetch and summarize
  - name: max_length
    type: integer
    required: false
    description: Maximum summary length in words

models:
  - gpt-4o-mini

tools:
  - llm
  - web_fetch

steps:
  - action: web_fetch
    url: "{{url}}"
    output: page_content
  - action: llm.chat
    model: gpt-4o-mini
    prompt: "Summarize the following in {{max_length | default: 100}} words:\\n{{page_content}}"`,
  },
  {
    name: 'k8s-health',
    version: 'v0.3.0',
    filename: 'k8s-health.yaml',
    lastReload: new Date(Date.now() - 900_000),
    description: 'Checks the health of a Kubernetes cluster and reports pod status, resource usage, and alerts.',
    parameters: [
      { name: 'namespace', type: 'string', required: false, description: 'Kubernetes namespace to check (default: all)' },
      { name: 'context', type: 'string', required: false, description: 'Kubectl context to use' },
    ],
    requiredModels: ['gpt-4o-mini'],
    requiredTools: ['llm', 'kubectl'],
    runtime: 'k8s',
    yaml: `name: k8s-health
version: v0.3.0
description: Checks the health of a Kubernetes cluster.

parameters:
  - name: namespace
    type: string
    required: false
    description: Kubernetes namespace (default: all)
  - name: context
    type: string
    required: false
    description: Kubectl context to use

models:
  - gpt-4o-mini

tools:
  - llm
  - kubectl

steps:
  - action: kubectl
    command: "get pods --all-namespaces -o json"
    output: pod_data
  - action: llm.chat
    model: gpt-4o-mini
    prompt: "Analyze this K8s cluster health:\\n{{pod_data}}"`,
  },
  {
    name: 'fetch-url',
    version: 'v0.1.0',
    filename: 'fetch-url.yaml',
    lastReload: new Date(Date.now() - 1_800_000),
    description: 'Fetches raw content from a URL and returns it as text. No LLM processing.',
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'URL to fetch' },
      { name: 'timeout', type: 'integer', required: false, description: 'Timeout in seconds (default: 30)' },
    ],
    requiredModels: [],
    requiredTools: ['web_fetch'],
    runtime: 'docker',
    yaml: `name: fetch-url
version: v0.1.0
description: Fetches raw content from a URL.

parameters:
  - name: url
    type: string
    required: true
    description: URL to fetch
  - name: timeout
    type: integer
    required: false
    description: Timeout in seconds (default: 30)

tools:
  - web_fetch

steps:
  - action: web_fetch
    url: "{{url}}"
    timeout: "{{timeout | default: 30}}"`,
  },
  {
    name: 'slack-notify',
    version: 'v0.2.0',
    filename: 'slack-notify.yaml',
    lastReload: new Date(Date.now() - 2_400_000),
    description: 'Sends a notification message to a Slack channel via webhook.',
    parameters: [
      { name: 'channel', type: 'string', required: true, description: 'Slack channel name' },
      { name: 'message', type: 'string', required: true, description: 'Message text to send' },
    ],
    requiredModels: [],
    requiredTools: ['slack_webhook'],
    runtime: 'local',
    yaml: `name: slack-notify
version: v0.2.0
description: Sends a notification to Slack.

parameters:
  - name: channel
    type: string
    required: true
    description: Slack channel name
  - name: message
    type: string
    required: true
    description: Message text to send

tools:
  - slack_webhook

steps:
  - action: slack_webhook.post
    channel: "{{channel}}"
    text: "{{message}}"`,
  },
];

/* ---------- Events mock data ---------- */

function generateEvents(): EventRecord[] {
  const records: EventRecord[] = [];
  const taskIds = [
    'a3f9b2c1-8d4e-4f1a-b6c7-2e9d3f0a1b5c',
    'b7e4d8f2-1c3a-4e6b-9d2f-5a8c7b0e3d1f',
    'c1d5e9a3-6b2f-4c8d-a7e1-3f0b9c4d2e6a',
    'd4f8a2b6-9e3c-4d7a-b1f5-8c2d6e0a4b9f',
    'e6a1c3d7-2b4f-4e9c-d8a2-1f5b7c0e9d3a',
  ];

  const eventSequences: { type: EventType; model: string | null; cost: number | null }[][] = [
    [
      { type: 'task.started', model: null, cost: null },
      { type: 'task.llm_call', model: 'gpt-4o-mini', cost: 0.004 },
      { type: 'task.tool_call', model: null, cost: null },
      { type: 'task.llm_call', model: 'gpt-4o-mini', cost: 0.002 },
      { type: 'task.completed', model: null, cost: 0.006 },
    ],
    [
      { type: 'task.started', model: null, cost: null },
      { type: 'task.llm_call', model: 'claude-haiku-4-5', cost: 0.003 },
      { type: 'task.completed', model: null, cost: 0.003 },
    ],
    [
      { type: 'task.started', model: null, cost: null },
      { type: 'task.llm_call', model: 'gpt-4o-mini', cost: 0.005 },
      { type: 'task.tool_call', model: null, cost: null },
      { type: 'task.failed', model: null, cost: 0.005 },
    ],
    [
      { type: 'task.started', model: null, cost: null },
      { type: 'task.policy_blocked', model: null, cost: null },
    ],
    [
      { type: 'task.started', model: null, cost: null },
      { type: 'task.llm_call', model: 'gpt-4o', cost: 0.012 },
      { type: 'task.tool_call', model: null, cost: null },
      { type: 'task.llm_call', model: 'gpt-4o', cost: 0.008 },
      { type: 'task.timeout', model: null, cost: 0.020 },
    ],
  ];

  let id = 1;
  const baseTime = Date.now() - 3_600_000;

  for (let t = 0; t < taskIds.length; t++) {
    const seq = eventSequences[t % eventSequences.length];
    let offset = t * 12_000;

    for (const event of seq) {
      records.push({
        id: `evt-${String(id).padStart(6, '0')}`,
        timestamp: new Date(baseTime + offset),
        taskId: taskIds[t],
        eventType: event.type,
        model: event.model,
        cost: event.cost,
        payload: { taskId: taskIds[t], type: event.type },
      });
      offset += Math.floor(Math.random() * 2000) + 200;
      id++;
    }
  }

  // Add more events to make the table substantial
  for (let i = 0; i < 40; i++) {
    const taskIdx = i % taskIds.length;
    const seqIdx = i % eventSequences.length;
    const seq = eventSequences[seqIdx];
    let offset = (taskIds.length + i) * 8_000;

    for (const event of seq) {
      records.push({
        id: `evt-${String(id).padStart(6, '0')}`,
        timestamp: new Date(baseTime + offset),
        taskId: taskIds[taskIdx],
        eventType: event.type,
        model: event.model,
        cost: event.cost,
        payload: { taskId: taskIds[taskIdx], type: event.type },
      });
      offset += Math.floor(Math.random() * 1500) + 100;
      id++;
    }
  }

  return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export const events: EventRecord[] = generateEvents();

export const eventTypes: EventType[] = [
  'task.started',
  'task.llm_call',
  'task.tool_call',
  'task.completed',
  'task.failed',
  'task.policy_blocked',
  'task.timeout',
];

export const timeRanges = [
  { label: 'Last 15m', value: '15m' },
  { label: 'Last 1h', value: '1h' },
  { label: 'Last 6h', value: '6h' },
  { label: 'Last 24h', value: '24h' },
  { label: 'Last 7d', value: '7d' },
] as const;
