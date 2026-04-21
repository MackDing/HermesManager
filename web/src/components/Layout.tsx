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
      {/* Sidebar — Dracula dark, gradient accents */}
      <aside className="w-[240px] shrink-0 bg-[#282A36] flex flex-col border-r border-[#44475A]">
        {/* Logo with Orbitron + gradient text */}
        <div className="px-4 py-5 border-b border-[#44475A]">
          <h1 className="font-display text-lg font-bold text-gradient leading-tight tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}>
            HermesManager
          </h1>
          <span className="text-[var(--text-xs)] text-[#6272A4] font-[family-name:var(--font-mono)]">
            v1.0.0
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
                    `flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'text-gradient bg-[rgba(189,147,249,0.1)]'
                        : 'text-[#6272A4] hover:bg-[rgba(189,147,249,0.06)] hover:text-[#F8F8F2]'
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

        <div className="px-3 py-3 border-t border-[#44475A]">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-auto bg-[var(--color-bg)]">
        <div className="p-6 max-w-[1536px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
