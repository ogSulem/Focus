'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { UserProfileWidget } from './user-profile-widget';

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconTasks() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}
function IconHabits() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
function IconTimer() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconBrain() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.13Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.13Z"/>
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function IconFocus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
      <path d="M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41"/>
    </svg>
  );
}

function IconKanban() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconNotes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
function IconGoals() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  const isDashboard = pathname === '/dashboard';
  const isSettings = pathname === '/settings';
  const isKanban = pathname === '/kanban';
  const isAnalytics = pathname === '/analytics';
  const isFocus = pathname === '/focus';
  const isNotes = pathname === '/notes';
  const isGoals = pathname === '/goals';

  const navItems: { icon: React.ReactNode; label: string; href: string; active?: boolean }[] = [
    { icon: <IconChart />, label: 'Дашборд', href: '/dashboard', active: isDashboard },
    { icon: <IconTasks />, label: 'Задачи', href: '/dashboard#tasks-section' },
    { icon: <IconHabits />, label: 'Привычки', href: '/dashboard#habits-section' },
    { icon: <IconKanban />, label: 'Kanban', href: '/kanban', active: isKanban },
    { icon: <IconAnalytics />, label: 'Аналитика', href: '/analytics', active: isAnalytics },
    { icon: <IconFocus />, label: 'Focus Mode', href: '/focus', active: isFocus },
    { icon: <IconNotes />, label: 'Заметки', href: '/notes', active: isNotes },
    { icon: <IconGoals />, label: 'Цели', href: '/goals', active: isGoals },
    { icon: <IconTimer />, label: 'Pomodoro', href: '/dashboard#focus-timer' },
    { icon: <IconBrain />, label: 'AI Инсайты', href: '/dashboard#ai-section' },
    { icon: <IconSettings />, label: 'Настройки', href: '/settings', active: isSettings },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('nt-token');
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="btn btn-ghost md:hidden"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 50,
          padding: '8px', width: 40, height: 40, justifyContent: 'center',
        }}
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className={`sidebar animate-slide-right ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>NeuroTrack</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>AI Productivity</p>
            </div>
          </div>
        </div>

        {/* User Profile Widget */}
        <UserProfileWidget />

        {/* Nav */}
        <div style={{ padding: '12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const isAnchor = item.href.includes('#');
            const navStyle: React.CSSProperties = {
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              borderRadius: 10,
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: item.active ? 600 : 400,
              background: item.active ? 'rgba(99,102,241,0.10)' : 'transparent',
              color: item.active ? 'var(--accent-1)' : 'var(--text-secondary)',
              transition: 'all 0.15s var(--ease)',
              textDecoration: 'none',
              borderLeft: item.active ? '3px solid var(--accent-1)' : '3px solid transparent',
              boxShadow: item.active ? 'inset 0 0 0 1px rgba(99,102,241,0.08)' : 'none',
              cursor: 'pointer',
            };
            const content = (
              <>
                <span style={{ opacity: item.active ? 1 : 0.7 }}>{item.icon}</span>
                {item.label}
                {item.active && (
                  <span style={{
                    marginLeft: 'auto',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent-1)',
                  }} />
                )}
              </>
            );
            const hoverEnter = (e: React.MouseEvent<HTMLElement>) => {
              if (!item.active) {
                (e.currentTarget as HTMLElement).style.background = 'var(--border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              }
            };
            const hoverLeave = (e: React.MouseEvent<HTMLElement>) => {
              if (!item.active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }
            };
            return isAnchor ? (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={navStyle}
                onMouseEnter={hoverEnter}
                onMouseLeave={hoverLeave}
              >
                {content}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={navStyle}
                onMouseEnter={hoverEnter}
                onMouseLeave={hoverLeave}
              >
                {content}
              </Link>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ padding: '10px 12px 20px', borderTop: '1px solid var(--border)' }}>
          {/* Logout button */}
          <button
            onClick={() => { void handleLogout(); }}
            disabled={loggingOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 12px',
              borderRadius: 10, border: 'none', cursor: loggingOut ? 'default' : 'pointer',
              fontSize: '0.8rem', fontWeight: 500,
              color: loggingOut ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              background: 'transparent',
              transition: 'all 0.15s var(--ease)',
              marginBottom: 8,
            }}
            onMouseEnter={(e) => {
              if (!loggingOut) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
                (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            {loggingOut ? (
              <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <IconLogout />
            )}
            {loggingOut ? 'Выход...' : 'Выйти'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>v8.0</span>
              {/* Keyboard shortcuts hint button */}
              <button
                onClick={() => {
                  document.dispatchEvent(
                    new KeyboardEvent('keydown', { key: '?', bubbles: true }),
                  );
                }}
                aria-label="Show keyboard shortcuts"
                title="Keyboard shortcuts (?)"
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: '1.5px solid var(--border-strong)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.65rem', fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s var(--ease)',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-1)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)';
                }}
              >
                ?
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}

