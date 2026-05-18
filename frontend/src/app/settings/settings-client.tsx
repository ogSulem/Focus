'use client';

import { useState } from 'react';
import { toast } from '@/components/toast';
import { NotificationPermissionButton } from '@/components/deadline-notifier';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface SettingsClientProps {
  profile: UserProfile | null;
  apiUrl: string;
  token: string;
}

export function SettingsClient({ profile, apiUrl, token }: SettingsClientProps) {
  const [name, setName] = useState(profile?.name ?? '');
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('nt-theme');
    const attr = document.documentElement.getAttribute('data-theme');
    return (saved ?? attr ?? 'light') as 'light' | 'dark';
  });
  const [focusDuration, setFocusDuration] = useState(() => {
    if (typeof window === 'undefined') return 25;
    const fd = parseInt(localStorage.getItem('nt-focus-duration') ?? '25', 10);
    return Number.isNaN(fd) ? 25 : fd;
  });
  const [shortBreak, setShortBreak] = useState(() => {
    if (typeof window === 'undefined') return 5;
    const sb = parseInt(localStorage.getItem('nt-short-break') ?? '5', 10);
    return Number.isNaN(sb) ? 5 : sb;
  });
  const [longBreak, setLongBreak] = useState(() => {
    if (typeof window === 'undefined') return 15;
    const lb = parseInt(localStorage.getItem('nt-long-break') ?? '15', 10);
    return Number.isNaN(lb) ? 15 : lb;
  });

  function handleThemeChange(next: 'light' | 'dark') {
    setTheme(next);
    localStorage.setItem('nt-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  function handleSaveFocusPrefs() {
    localStorage.setItem('nt-focus-duration', String(focusDuration));
    localStorage.setItem('nt-short-break', String(shortBreak));
    localStorage.setItem('nt-long-break', String(longBreak));
    toast.success('Настройки таймера сохранены', 'Вступят в силу при следующем запуске таймера');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    borderRadius: 10, border: '1.5px solid var(--border-strong)',
    background: 'var(--bg-base)', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Профиль обновлён', 'Изменения сохранены');
    } catch {
      toast.error('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Новый пароль должен быть не менее 8 символов');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success('Пароль изменён', 'Новый пароль вступил в силу');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось изменить пароль');
    } finally {
      setSavingPwd(false);
    }
  }

  async function handleExport(format: 'json' | 'csv') {
    try {
      const res = await fetch(`${apiUrl}/tasks/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Экспорт завершён (${format.toUpperCase()})`);
    } catch {
      toast.error('Не удалось экспортировать данные');
    }
  }

  const initials = (profile?.name ?? profile?.email ?? '?')
    .split(/[\s@_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 28 }}>
        <h1 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
          ⚙️ Настройки
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          Управление аккаунтом, данными и экспортом
        </p>
      </div>

      {/* Profile card */}
      <section className="glass-card glow-card animate-slide-up" style={{ padding: '24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
              {profile?.name ?? profile?.email?.split('@')[0] ?? 'Пользователь'}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              {profile?.email}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
              🗓 В системе с {memberSince}
            </p>
          </div>
        </div>

        <h2 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 14 }}>
          Профиль
        </h2>

        <form onSubmit={(e) => { void handleSaveProfile(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              maxLength={80}
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-1)'; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              Email изменить нельзя — это основной идентификатор аккаунта
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ padding: '9px 22px', fontSize: '0.85rem' }}
            >
              {saving ? (
                <span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
              ) : '💾 Сохранить'}
            </button>
          </div>
        </form>
      </section>

      {/* Password change card */}
      <section className="glass-card glow-card animate-slide-up" style={{ padding: '24px', marginBottom: 16, animationDelay: '30ms' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 6 }}>
          🔒 Изменить пароль
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 18, lineHeight: 1.5 }}>
          Убедитесь, что используете надёжный уникальный пароль.
        </p>
        <form onSubmit={(e) => { void handleChangePassword(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Текущий пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Введите текущий пароль"
                required
                minLength={8}
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-1)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; }}
              />
              <button type="button" onClick={() => setShowCurrentPwd((p) => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, lineHeight: 1 }}>
                {showCurrentPwd
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Новый пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                minLength={8}
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-1)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; }}
              />
              <button type="button" onClick={() => setShowNewPwd((p) => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, lineHeight: 1 }}>
                {showNewPwd
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Подтвердите новый пароль
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите новый пароль"
              required
              minLength={8}
              style={{
                ...inputStyle,
                borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : undefined,
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = confirmPassword !== newPassword ? '#ef4444' : 'var(--accent-1)'; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = confirmPassword !== newPassword ? '#ef4444' : 'var(--border-strong)'; }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: 4 }}>
                ⚠️ Пароли не совпадают
              </p>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPwd || !currentPassword || !newPassword || newPassword !== confirmPassword}
              style={{ padding: '9px 22px', fontSize: '0.85rem' }}
            >
              {savingPwd ? (
                <span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
              ) : '🔒 Изменить пароль'}
            </button>
          </div>
        </form>
      </section>

      {/* Appearance card */}
      <section className="glass-card glow-card animate-slide-up" style={{ padding: '24px', marginBottom: 16, animationDelay: '45ms' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 6 }}>
          🎨 Внешний вид
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 18, lineHeight: 1.5 }}>
          Тема интерфейса и настройки отображения.
        </p>

        {/* Theme selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Тема
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: 12,
                  border: `2px solid ${theme === t ? 'var(--accent-1)' : 'var(--border-strong)'}`,
                  background: theme === t ? 'rgba(99,102,241,0.08)' : 'var(--bg-base)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s var(--ease)',
                }}
              >
                <div style={{
                  width: 44, height: 28, borderRadius: 7,
                  background: t === 'dark' ? '#0a0a0f' : '#f4f4f8',
                  border: '1px solid var(--border-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem',
                }}>
                  {t === 'dark' ? '🌙' : '☀️'}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: theme === t ? 700 : 500, color: theme === t ? 'var(--accent-1)' : 'var(--text-secondary)' }}>
                  {t === 'light' ? 'Светлая' : 'Тёмная'}
                </span>
                {theme === t && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--accent-1)', fontWeight: 700 }}>✓ Активна</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Focus timer durations */}
        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            ⏱ Настройки Pomodoro (минуты)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            {([
              { label: '🎯 Фокус', value: focusDuration, setter: setFocusDuration, min: 5, max: 90 },
              { label: '☕ Кор. перерыв', value: shortBreak, setter: setShortBreak, min: 1, max: 30 },
              { label: '🌴 Дл. перерыв', value: longBreak, setter: setLongBreak, min: 5, max: 60 },
            ] as { label: string; value: number; setter: (v: number) => void; min: number; max: number }[]).map(({ label, value, setter, min, max }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 5 }}>{label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setter(Math.max(min, value - 1))}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-base)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >−</button>
                  <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= min && v <= max) setter(v);
                    }}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '1.5px solid var(--border-strong)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-1)'; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setter(Math.min(max, value + 1))}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--bg-base)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveFocusPrefs}
              style={{ padding: '9px 22px', fontSize: '0.85rem' }}
            >
              💾 Сохранить настройки
            </button>
          </div>
        </div>
      </section>

      {/* Data export card */}
      <section className="glass-card glow-card animate-slide-up" style={{ padding: '24px', marginBottom: 16, animationDelay: '60ms' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 6 }}>
          📦 Экспорт данных
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 18, lineHeight: 1.5 }}>
          Скачайте все ваши задачи в удобном формате для резервной копии или переноса данных.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost"
            onClick={() => { void handleExport('json'); }}
            style={{ gap: 6, fontSize: '0.82rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Скачать JSON
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => { void handleExport('csv'); }}
            style={{ gap: 6, fontSize: '0.82rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Скачать CSV
          </button>
          <NotificationPermissionButton />
        </div>
      </section>

      {/* Keyboard shortcuts card */}
      <section className="glass-card glow-card animate-slide-up" style={{ padding: '24px', marginBottom: 16, animationDelay: '120ms' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 14 }}>
          ⌨️ Горячие клавиши
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { keys: ['⌘', 'K'], desc: 'Command Palette — быстрый поиск' },
            { keys: ['N'], desc: 'Создать новую задачу' },
            { keys: ['H'], desc: 'Создать новую привычку' },
            { keys: ['Space'], desc: 'Старт/пауза Focus Timer' },
            { keys: ['Esc'], desc: 'Закрыть модальное окно' },
          ].map(({ keys, desc }) => (
            <div key={desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{desc}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {keys.map((k) => (
                  <kbd key={k} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                    borderRadius: 5, padding: '2px 7px',
                    fontFamily: '-apple-system, monospace', fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--text-secondary)',
                    boxShadow: '0 1px 0 var(--border-strong)',
                    minWidth: 20, textAlign: 'center',
                  }}>
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About card */}
      <section className="glass-card glow-card animate-slide-up" style={{ padding: '24px', animationDelay: '180ms' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 14 }}>
          ℹ️ О системе
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Версия', value: 'v8.0' },
            { label: 'Frontend', value: 'Next.js 16 · React 19' },
            { label: 'Backend', value: 'NestJS 11 · Prisma 6' },
            { label: 'База данных', value: 'PostgreSQL 16' },
            { label: 'Auth', value: 'JWT + httpOnly cookie' },
            { label: 'Инфра', value: 'Docker Compose' },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--border)' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(99,102,241,0.05)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.12)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>
            🧠 <strong style={{ color: 'var(--text-secondary)' }}>Focus</strong> — интеллектуальная система планирования и анализа продуктивности.
            Gamification, AI-инсайты, Focus Timer, тепловые карты и полная аналитика в одном месте.
          </p>
        </div>
      </section>
    </div>
  );
}
