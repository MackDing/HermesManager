import {
  Play,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
} from 'lucide-react'
import type { TaskStatus } from '../lib/mock-data'

const STATUS_CONFIG: Record<
  TaskStatus,
  { bg: string; text: string; icon: typeof Play; label: string }
> = {
  running: {
    bg: 'bg-[var(--color-info-bg)]',
    text: 'text-[var(--color-info)]',
    icon: Play,
    label: 'Running',
  },
  completed: {
    bg: 'bg-[var(--color-success-bg)]',
    text: 'text-[var(--color-success)]',
    icon: CheckCircle2,
    label: 'Completed',
  },
  failed: {
    bg: 'bg-[var(--color-error-bg)]',
    text: 'text-[var(--color-error)]',
    icon: XCircle,
    label: 'Failed',
  },
  timeout: {
    bg: 'bg-[var(--color-warning-bg)]',
    text: 'text-[var(--color-warning)]',
    icon: Clock,
    label: 'Timeout',
  },
  blocked: {
    bg: 'bg-[var(--color-error-bg)]',
    text: 'text-[var(--color-error)]',
    icon: ShieldAlert,
    label: 'Blocked',
  },
}

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-[family-name:var(--font-mono)] ${config.bg} ${config.text}`}
      aria-label={`Task state: ${config.label}`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </span>
  )
}
