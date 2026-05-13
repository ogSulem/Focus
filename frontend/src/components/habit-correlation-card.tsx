'use client';

import type { HabitCorrelationPayload } from '@/lib/api';

interface HabitCorrelationCardProps {
  habitCorrelation: HabitCorrelationPayload;
}

const DIR_META = {
  positive: { color: '#10b981', label: 'Позитивный предиктор', emoji: '📈' },
  negative: { color: '#ef4444', label: 'Негативная корреляция', emoji: '📉' },
  neutral:  { color: '#6b7280', label: 'Нейтральная связь',    emoji: '➖' },
};

function CorrelationBar({ r, color }: { r: number; color: string }) {
  // r ∈ [-1, 1] → visual bar centered at 0
  const abs = Math.abs(r);
  const pct = abs * 100;
  const isNeg = r < 0;

  return (
    <div style={{ position: 'relative', height: 8, width: '100%', background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
      {/* Center line */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, bottom: 0,
        width: 1, background: 'var(--border-strong)',
      }} />
      {/* Bar */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        left: isNeg ? `${50 - pct / 2}%` : '50%',
        width: `${pct / 2}%`,
        background: color,
        borderRadius: 99,
        transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 0 8px ${color}66`,
        minWidth: pct > 0 ? 2 : 0,
      }} />
    </div>
  );
}

export function HabitCorrelationCard({ habitCorrelation }: HabitCorrelationCardProps) {
  const { correlations, summary, modelFormula, dataWindowDays } = habitCorrelation;

  return (
    <section className="card glow-card animate-slide-up" style={{ padding: '22px', marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            🔬 Корреляция привычек и продуктивности
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            Коэффициент Пирсона · лаг +1 день · окно {dataWindowDays} дней
          </p>
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 600,
          color: 'var(--text-secondary)',
          background: 'var(--border)',
          borderRadius: 999, padding: '3px 10px',
          border: '1px solid var(--border-strong)',
        }}>
          n = {dataWindowDays} дней
        </span>
      </div>

      {/* Summary insight */}
      <div style={{
        padding: '10px 14px', borderRadius: 12, marginBottom: 16,
        background: 'rgba(99,102,241,0.07)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          💡 {summary}
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['positive', 'negative', 'neutral'] as const).map((d) => (
          <span key={d} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: DIR_META[d].color, display: 'inline-block' }} />
            {DIR_META[d].label}
          </span>
        ))}
        <span style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', marginLeft: 4 }}>
          (r: −1 ←&nbsp;&nbsp;0&nbsp;&nbsp;→ +1)
        </span>
      </div>

      {correlations.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
          📊 Недостаточно данных. Отслеживайте привычки минимум 8 дней.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {correlations.map((item) => {
            const dm = DIR_META[item.direction];
            return (
              <div key={item.habitId} style={{
                padding: '12px 14px', borderRadius: 12,
                background: `${dm.color}08`,
                border: `1px solid ${dm.color}25`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: '0.85rem' }}>{dm.emoji}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.habitName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      color: 'var(--text-tertiary)',
                    }}>
                      n={item.activeDays}д
                    </span>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 800,
                      color: dm.color,
                      background: `${dm.color}18`,
                      borderRadius: 8, padding: '2px 8px',
                      border: `1px solid ${dm.color}40`,
                    }}>
                      r = {item.r > 0 ? '+' : ''}{item.r}
                    </span>
                  </div>
                </div>
                <CorrelationBar r={item.r} color={dm.color} />
                <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {item.interpretation}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Formula */}
      <details style={{ marginTop: 14 }}>
        <summary style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', cursor: 'pointer', userSelect: 'none' }}>
          📐 Формула Пирсона (lag-1)
        </summary>
        <p style={{
          marginTop: 5, fontSize: '0.65rem', fontFamily: 'monospace',
          color: 'var(--text-tertiary)',
          background: 'var(--border)', padding: '5px 8px',
          borderRadius: 7, wordBreak: 'break-all',
        }}>
          {modelFormula}
        </p>
      </details>
    </section>
  );
}
