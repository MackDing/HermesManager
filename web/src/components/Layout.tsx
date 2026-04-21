import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ListChecks } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/skills', label: 'Skills', icon: BookOpen },
  { to: '/events', label: 'Events', icon: ListChecks },
] as const

export function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — 240px fixed per MASTER §10 */}
      <aside className="w-[240px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <h1 className="text-[var(--text-base)] font-semibold text-[var(--color-fg)] leading-tight tracking-tight">
            HermesManager
          </h1>
          <span className="text-[var(--text-xs)] text-[var(--color-fg-subtle)] font-[family-name:var(--font-mono)]">
            v0.1.0
          </span>
        </div>

        <nav className="flex-1 px-2 py-3" aria-label="Main navigation">
          <ul className="space-y-0.5 list-none p-0 m-0">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity duration-150 ${
                      isActive
                        ? 'bg-[var(--color-bg-subtle)] text-[var(--color-fg)]'
                        : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-3 py-3 border-t border-[var(--color-border)]">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 max-w-[1536px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
