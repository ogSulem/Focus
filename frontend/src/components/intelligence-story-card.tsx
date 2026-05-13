'use client';

import type { IntelligencePayload } from '@/lib/api';

interface IntelligenceStoryCardProps {
  intelligence: IntelligencePayload;
}

function riskColor(value: number): string {
  if (value >= 75) return '#ef4444';
  if (value >= 50) return '#f59e0b';
  return '#10b981';
}

export function IntelligenceStoryCard({ intelligence }: IntelligenceStoryCardProps) {
  const topPlan = intelligence.adaptivePlanning.prioritizedTasks.slice(0, 3);
  const topRisk = intelligence.predictions.deadlineRisk.slice(0, 3);
  const topHabit = intelligence.predictions.habitSuccess.slice(0, 3);

  return (
    <section className="card glow-card animate-slide-up" style={{ padding: '22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            🧠 Intelligence Core
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Адаптивное планирование · прогноз рисков · explainable AI
          </p>
        </div>
        <span className="badge badge-progress" style={{ fontSize: '0.68rem' }}>
          energy: {intelligence.adaptivePlanning.energyLevel}
        </span>
      </div>

      <div className="dashboard-grid-equal" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Приоритетный план</p>
          {topPlan.map((task) => (
            <div key={task.id} className="gradient-border" style={{ borderRadius: 12, padding: '10px 12px', background: 'var(--bg-base)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-1)', fontWeight: 700 }}>{task.score}</span>
              </div>
              <p style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                {task.reasons.slice(0, 2).join(' · ') || 'score-based ranking'}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Риск срыва дедлайна</p>
          {topRisk.map((item) => (
            <div key={item.id} style={{ borderRadius: 12, border: '1px solid var(--border)', padding: '10px 12px', background: 'var(--bg-base)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</p>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: riskColor(item.riskPercent) }}>
                  {item.riskPercent}%
                </span>
              </div>
              <p style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                {item.factors.slice(0, 2).join(' · ') || 'стандартный риск-профиль'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {intelligence.recommendations.slice(0, 3).map((recommendation) => (
          <article
            key={recommendation.title}
            className="animate-scale-in"
            style={{
              borderRadius: 12,
              border: '1px solid rgba(99,102,241,0.2)',
              background: 'linear-gradient(180deg, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.03) 100%)',
              padding: '12px 14px',
            }}
          >
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {recommendation.title}
            </p>
            <p style={{ marginTop: 5, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {recommendation.description}
            </p>
            <p style={{ marginTop: 7, fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
              score {recommendation.score} · {recommendation.reason}
            </p>
          </article>
        ))}
      </div>

      <section style={{ marginTop: 10, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-base)', padding: '12px 14px' }}>
        <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 8 }}>
          Прозрачность модели
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Формула планирования</p>
            <code style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {intelligence.modelMeta.planningFormula}
            </code>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Формула прогнозирования</p>
            <code style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {intelligence.modelMeta.predictionFormula}
            </code>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.45 }}>
            {intelligence.modelMeta.explainability}
          </p>
        </div>
      </section>

      {topHabit.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {topHabit.map((habit) => (
            <span
              key={habit.id}
              className="badge badge-done"
              style={{ fontSize: '0.68rem', display: 'inline-flex', gap: 5, alignItems: 'center' }}
            >
              {habit.name}: {habit.probability7dPercent}% ({habit.confidence})
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
