'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function KanbanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
    </svg>
  );
}
function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function FocusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
    </svg>
  );
}
function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
function GoalsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',          label: 'Главная',   icon: <HomeIcon />,     exact: true },
  { href: '/kanban',    label: 'Kanban',    icon: <KanbanIcon /> },
  { href: '/analytics', label: 'Аналитика', icon: <AnalyticsIcon /> },
  { href: '/focus',     label: 'Фокус',     icon: <FocusIcon /> },
  { href: '/notes',     label: 'Заметки',   icon: <NotesIcon /> },
  { href: '/goals',     label: 'Цели',      icon: <GoalsIcon /> },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Мобильная навигация"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '8px 12px',
              borderRadius: 12,
              color: isActive ? 'var(--accent-1)' : 'var(--text-tertiary)',
              textDecoration: 'none',
              transition: 'color 0.15s var(--ease)',
              flex: 1,
              background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
              minWidth: 0,
              position: 'relative',
            }}
          >
            <span style={{ opacity: isActive ? 1 : 0.7, display: 'flex' }}>{item.icon}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 400, whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: 2,
                width: 4, height: 4,
                borderRadius: '50%',
                background: 'var(--accent-1)',
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
