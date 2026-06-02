import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nt_access')?.value;

  if (token) {
    redirect('/dashboard');
  }

  return (
    <main style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      <section
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1100,
          margin: '0 auto',
          padding: '32px 20px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <header
          className="card animate-fade-in"
          style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Focus</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>AI Productivity Platform</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Вход
            </Link>
            <Link href="/login" className="btn btn-primary btn-neon" style={{ textDecoration: 'none' }}>
              Начать бесплатно
            </Link>
          </div>
        </header>

        <section className="card animate-scale-in" style={{ padding: '34px 26px' }}>
          <span className="badge badge-done" style={{ marginBottom: 12 }}>Для реальных пользователей</span>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(1.9rem, 6vw, 3rem)', lineHeight: 1.1, marginBottom: 12 }}>
            Всё управление продуктивностью в одном месте
          </h1>
          <p style={{ maxWidth: 700, color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 18 }}>
            Focus объединяет задачи, привычки, фокус-сессии, аналитику и AI-рекомендации в один удобный интерфейс.
            Без лишнего — только инструмент, который помогает делать больше каждый день.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary btn-neon" style={{ textDecoration: 'none' }}>
              Войти и открыть дашборд
            </Link>
            <Link href="#features" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Что внутри
            </Link>
          </div>
        </section>

        <section id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            ['⚡ Умный дашборд', 'Метрики, статус задач, дедлайны и персональный прогресс в реальном времени.'],
            ['🧠 AI-инсайты', 'Рекомендации, прогнозы, симуляции сценариев и анализ продуктивности.'],
            ['⏱ Focus Mode', 'Pomodoro-таймер с привязкой к задачам, сессиям и историей.'],
            ['📊 Глубокая аналитика', 'Heatmap, тренды недели, риски срывов дедлайнов и динамика привычек.'],
            ['✅ Задачи + Kanban', 'Планирование и приоритизация через списки, фильтры и доску.'],
            ['🎯 Геймификация', 'Уровни, streak, достижения и система прогресса.'],
          ].map(([title, text], i) => (
            <article key={title} className="card animate-slide-up" style={{ padding: '16px', animationDelay: `${i * 60}ms` }}>
              <h2 style={{ fontSize: '0.92rem', marginBottom: 6, color: 'var(--text-primary)' }}>{title}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{text}</p>
            </article>
          ))}
        </section>

        <section className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Готовы повысить продуктивность?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.86rem' }}>
            Создайте аккаунт и переходите в полноценный рабочий дашборд.
          </p>
          <Link href="/login" className="btn btn-primary btn-neon" style={{ textDecoration: 'none' }}>
            Перейти к входу
          </Link>
        </section>
      </section>
    </main>
  );
}
