'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type Mode = 'login' | 'register';

export function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in (cookie set by middleware), redirect
  useEffect(() => {
    // Middleware already handles the redirect, but we also check localStorage
    // for the legacy flow so users aren't stuck on login
    const token = typeof window !== 'undefined' ? localStorage.getItem('nt-token') : null;
    if (token) {
      void fetch('/api/auth/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      }).then(() => router.replace('/dashboard'));
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Заполните все поля'); return; }
    setLoading(true);
    setError('');
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body: Record<string, string> = { email: email.trim(), password };
      if (mode === 'register' && name.trim()) body['name'] = name.trim();

      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',   // sends/receives httpOnly nt_refresh cookie
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        const msg = Array.isArray(data.message) ? (data.message as string[]).join(', ') : (data.message ?? 'Ошибка сервера');
        throw new Error(msg);
      }

      const { accessToken } = (await res.json()) as { accessToken: string };

      // Store in httpOnly cookie via Next.js route handler (no token in URL)
      await fetch('/api/auth/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      // Also keep in localStorage for client-side API calls in interactive components
      localStorage.setItem('nt-token', accessToken);

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    borderRadius: 12, border: '1.5px solid var(--border-strong)',
    background: 'var(--bg-base)', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 20,
      position: 'relative',
    }}>
      {/* Ambient blobs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      <div className="card animate-scale-in" style={{
        width: '100%', maxWidth: 420, padding: '36px 36px 32px',
        position: 'relative', zIndex: 1,
        boxShadow: 'var(--shadow-lg), 0 0 60px rgba(99,102,241,0.12)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div className="animate-float animate-glow" style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <h1 className="gradient-text" style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em' }}>Focus</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
            Интеллектуальная система планирования
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: 10, padding: 4, marginBottom: 22, gap: 4 }}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem',
                background: mode === m ? 'var(--bg-card)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: 'all 0.15s',
                boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {m === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            fontSize: '0.82rem', color: '#ef4444', lineHeight: 1.45,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={(e) => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-1)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus={mode === 'login'}
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-1)'; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-1)'; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-strong)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: 4, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPwd ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-neon"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.98rem', fontWeight: 700, marginTop: 6 }}
          >
            {loading ? (
              <span className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
            ) : mode === 'login' ? '🚀 Войти' : '✨ Создать аккаунт'}
          </button>
        </form>

        {/* Demo hint */}
        <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.12)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            💡 Нет аккаунта?{' '}
            <Link
              href="/"
              style={{ color: 'var(--accent-1)', textDecoration: 'none', fontWeight: 600 }}
            >
              Открыть демо-режим
            </Link>
            {' '}— без регистрации
          </p>
        </div>
      </div>
    </div>
  );
}

