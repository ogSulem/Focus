'use client';

import type { ScenarioSimulatorPayload } from '@/lib/api';

interface ScenarioSimulatorCardProps {
  scenarioSimulator: ScenarioSimulatorPayload;
}

const SCENARIO_META: Record<
  string,
  { emoji: string; color: string; label: string }
> = {
  'focus-sprint': {
    emoji: '🎯',
    color: '#6366f1',
    label: 'Усиление deep work',
  },
  'habit-discipline': {
    emoji: '🧩',
    color: '#10b981',
    label: 'Поведенческая дисциплина',
  },
  'hybrid-excellence': {
    emoji: '🚀',
    color: '#f59e0b',
    label: 'Комбинированный максимум',
  },
};

export function ScenarioSimulatorCard({
  scenarioSimulator,
}: ScenarioSimulatorCardProps) {
  const { baseline, scenarios, bestScenarioKey, confidence } = scenarioSimulator;
  const maxValue = Math.max(
    baseline.completedTasksWeekly,
    ...scenarios.map((s) => s.projectedCompletedTasksWeekly),
    1,
  );
  const confidenceLabel =
    confidence === 'high'
      ? 'Высокая'
      : confidence === 'medium'
        ? 'Средняя'
        : 'Низкая';

  return (
    <section className="card glow-card animate-slide-up" style={{ padding: '22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            🧪 What-if симулятор продуктивности
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            Сценарное прогнозирование на 7 дней по вашим данным
          </p>
        </div>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          background: 'var(--border)',
          border: '1px solid var(--border-strong)',
          borderRadius: 999,
          padding: '3px 10px',
        }}>
          Достоверность: {confidenceLabel}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10,
        marginBottom: 14,
      }}>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Базовый прогноз/неделю</p>
          <p style={{ fontSize: '1.08rem', fontWeight: 800, color: '#6366f1' }}>
            {baseline.completedTasksWeekly} задач
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Фокус в день</p>
          <p style={{ fontSize: '1.08rem', fontWeight: 800, color: '#10b981' }}>
            {baseline.avgFocusMinPerDay} мин
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Привычек в день</p>
          <p style={{ fontSize: '1.08rem', fontWeight: 800, color: '#f59e0b' }}>
            {baseline.avgHabitCompletionsPerDay}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {scenarios.map((scenario) => {
          const meta = SCENARIO_META[scenario.key] ?? {
            emoji: '📊',
            color: '#6b7280',
            label: 'Сценарий',
          };
          const width = `${(scenario.projectedCompletedTasksWeekly / maxValue) * 100}%`;
          const isBest = scenario.key === bestScenarioKey;

          return (
            <article
              key={scenario.key}
              style={{
                border: `1px solid ${meta.color}33`,
                borderRadius: 12,
                padding: '10px 12px',
                background: isBest ? `${meta.color}12` : `${meta.color}0a`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{meta.emoji}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {scenario.title}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    · {meta.label}
                  </span>
                  {isBest && (
                    <span style={{
                      fontSize: '0.62rem',
                      color: '#10b981',
                      border: '1px solid #10b98155',
                      borderRadius: 999,
                      padding: '1px 7px',
                      fontWeight: 700,
                    }}>
                      BEST
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: meta.color }}>
                    {scenario.projectedCompletedTasksWeekly} задач/нед
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    color: scenario.upliftPercent >= 0 ? '#10b981' : '#ef4444',
                    fontWeight: 700,
                  }}>
                    {scenario.upliftPercent >= 0 ? '+' : ''}
                    {scenario.upliftPercent}%
                  </span>
                </div>
              </div>

              <div style={{ height: 7, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginBottom: 7 }}>
                <div style={{
                  width,
                  height: '100%',
                  background: meta.color,
                  borderRadius: 99,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: `0 0 10px ${meta.color}66`,
                }} />
              </div>

              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                {scenario.assumptions.join(' · ')}
              </p>
            </article>
          );
        })}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          💡 {scenarioSimulator.explanation}
        </p>
      </div>

      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', cursor: 'pointer', userSelect: 'none' }}>
          📐 Модель сценарного прогноза
        </summary>
        <p style={{
          marginTop: 5,
          fontSize: '0.65rem',
          fontFamily: 'monospace',
          color: 'var(--text-tertiary)',
          background: 'var(--border)',
          padding: '5px 8px',
          borderRadius: 7,
          wordBreak: 'break-word',
        }}>
          {scenarioSimulator.modelFormula}
        </p>
      </details>
    </section>
  );
}
