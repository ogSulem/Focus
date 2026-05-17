'use client';

import { useState } from 'react';

const STORAGE_KEY = 'nt-onboarded';

const STEPS = [
  {
    emoji: '🧠',
    title: 'Добро пожаловать в NeuroTrack!',
    desc: 'Интеллектуальная система для управления задачами, привычками и анализа продуктивности.',
    color: '#6366f1',
  },
  {
    emoji: '✅',
    title: 'Задачи и подзадачи',
    desc: 'Создавайте задачи с приоритетами, тегами и подзадачами. Нажмите N или кнопку «+» для добавления.',
    color: '#10b981',
  },
  {
    emoji: '🔥',
    title: 'Привычки и стрики',
    desc: 'Отслеживайте ежедневные привычки и получайте уведомления при достижении milestone (7, 14, 30 дней!).',
    color: '#f59e0b',
  },
  {
    emoji: '🎯',
    title: 'Focus Timer',
    desc: 'Pomodoro-таймер (25/5/15 мин) прямо в интерфейсе. Нажмите Space для старта/паузы.',
    color: '#8b5cf6',
  },
  {
    emoji: '⌘',
    title: 'Быстрые команды',
    desc: 'Используйте ⌘K для быстрого поиска и навигации. Нажмите ? для списка всех горячих клавиш.',
    color: '#06b6d4',
  },
];

export function OnboardingModal() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [step, setStep] = useState(0);

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) finish(); }}
    >
      <div
        className="animate-scale-in"
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: '36px 32px 28px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 99,
                background: i === step ? current.color : 'var(--border-strong)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.25s var(--ease)',
              }}
              aria-label={`Шаг ${i + 1}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${current.color}22, ${current.color}44)`,
            border: `2px solid ${current.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 16px',
            boxShadow: `0 8px 32px ${current.color}30`,
          }}>
            {current.emoji}
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.3 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {current.desc}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <button
            onClick={finish}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none',
              background: 'transparent', color: 'var(--text-tertiary)',
              fontSize: '0.82rem', cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'; }}
          >
            Пропустить
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{
                  padding: '10px 20px', borderRadius: 12, border: '1.5px solid var(--border-strong)',
                  background: 'transparent', color: 'var(--text-secondary)',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                ← Назад
              </button>
            )}
            <button
              onClick={next}
              style={{
                padding: '10px 24px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
                color: '#fff',
                fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: `0 4px 16px ${current.color}40`,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px ${current.color}50`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${current.color}40`; }}
            >
              {step === STEPS.length - 1 ? '🚀 Начать!' : 'Далее →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
