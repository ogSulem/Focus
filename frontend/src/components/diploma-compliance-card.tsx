'use client';

interface DiplomaComplianceCardProps {
  checks?: Array<{ label: string; status: 'done' | 'in_progress' }>;
}

const DEFAULT_CHECKS: NonNullable<DiplomaComplianceCardProps['checks']> = [
  { label: 'Модульная fullstack-архитектура (Frontend/Backend/DB/Analytics)', status: 'done' },
  { label: 'JWT + refresh + защищённые маршруты', status: 'done' },
  { label: 'Task/Habit management + CRUD', status: 'done' },
  { label: 'AI-аналитика (rule-based + explainability)', status: 'done' },
  { label: 'Before/After экспериментальный отчёт', status: 'done' },
  { label: 'Dashboard: графики + heatmap + календарь дедлайнов', status: 'done' },
  { label: 'Dark mode + responsive + быстрые действия', status: 'done' },
  { label: 'Swagger / Docker / экспорт данных', status: 'done' },
  { label: 'Telegram bridge и интеграционный контур', status: 'done' },
  { label: 'CI/CD automation и расширенная прод-инфра', status: 'in_progress' },
];

export function DiplomaComplianceCard({ checks = DEFAULT_CHECKS }: DiplomaComplianceCardProps) {
  const doneCount = checks.filter((c) => c.status === 'done').length;
  const totalCount = checks.length;
  const progress = Math.round((doneCount / totalCount) * 100);

  return (
    <section className="card glow-card animate-slide-up" style={{ padding: '22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>🎓 Дипломный чеклист качества</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Самопроверка соответствия ключевым требованиям ТЗ/методических указаний
          </p>
        </div>
        <span className="badge badge-done" style={{ fontSize: '0.7rem' }}>
          готовность: {doneCount}/{totalCount} ({progress}%)
        </span>
      </div>

      <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-gradient)', transition: 'width 0.7s var(--ease)' }} />
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {checks.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              border: '1px solid var(--border)',
              padding: '8px 10px',
              background: 'var(--bg-base)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: '#fff',
                background: item.status === 'done' ? '#10b981' : '#f59e0b',
                flexShrink: 0,
              }}
            >
              {item.status === 'done' ? '✓' : '…'}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
