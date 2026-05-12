'use client';

import type { VelocityForecastPayload } from '@/lib/api';

interface VelocityForecastCardProps {
  forecast: VelocityForecastPayload;
}

const TREND_META = {
  growing: { label: 'Растущий', color: '#10b981', arrow: '↑', emoji: '📈' },
  declining: { label: 'Снижение', color: '#ef4444', arrow: '↓', emoji: '📉' },
  stable: { label: 'Стабильный', color: '#6366f1', arrow: '→', emoji: '📊' },
};

export function VelocityForecastCard({ forecast }: VelocityForecastCardProps) {
  const trend = TREND_META[forecast.trend];

  const allValues = [
    ...forecast.historicalWeeks.map((w) => w.completed),
    forecast.confidenceInterval.high,
  ];
  const maxVal = Math.max(...allValues, 1);

  const totalWeeks = forecast.historicalWeeks.length;

  return (
    <section className="card glow-card animate-slide-up" style={{ padding: '22px', marginBottom: 14 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {trend.emoji} Прогноз скорости выполнения
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            OLS регрессия · 8-недельная история · доверительный интервал 80%
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: trend.color,
              background: `${trend.color}18`,
              borderRadius: 999,
              padding: '3px 10px',
              border: `1px solid ${trend.color}40`,
            }}
          >
            {trend.arrow} {trend.label}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#8b5cf6',
              background: 'rgba(139,92,246,0.10)',
              borderRadius: 999,
              padding: '3px 10px',
              border: '1px solid rgba(139,92,246,0.25)',
            }}
          >
            R² = {forecast.rSquared}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          height: 110,
          marginBottom: 12,
          overflowX: 'auto',
        }}
      >
        {/* Historical bars */}
        {forecast.historicalWeeks.map((week, idx) => {
          const heightPct = (week.completed / maxVal) * 100;
          const isLast = idx === totalWeeks - 1;
          const weekShort = week.weekLabel.slice(5); // MM-DD
          return (
            <div
              key={week.weekLabel}
              title={`Неделя от ${week.weekLabel}: ${week.completed} задач`}
              style={{
                flex: '1 0 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                {week.completed}
              </span>
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: 4,
                  borderRadius: '6px 6px 2px 2px',
                  background: isLast
                    ? 'var(--accent-gradient)'
                    : 'rgba(99,102,241,0.35)',
                  transition: 'height 0.8s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isLast ? '0 0 10px rgba(99,102,241,0.4)' : undefined,
                }}
              />
              <span style={{ fontSize: '0.57rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {weekShort}
              </span>
            </div>
          );
        })}

        {/* Forecast bar with CI */}
        <div
          style={{
            flex: '1 0 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            height: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              color: trend.color,
            }}
          >
            {forecast.forecast}
          </span>
          {/* CI band + forecast bar stacked */}
          <div
            style={{
              width: '100%',
              height: `${(forecast.confidenceInterval.high / maxVal) * 100}%`,
              minHeight: 8,
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            {/* CI band */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${((forecast.confidenceInterval.high - forecast.confidenceInterval.low) / forecast.confidenceInterval.high) * 100}%`,
                background: `${trend.color}18`,
                borderRadius: 6,
                border: `1px dashed ${trend.color}50`,
              }}
            />
            {/* Forecast bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '20%',
                right: '20%',
                height: `${(forecast.forecast / forecast.confidenceInterval.high) * 100}%`,
                background: trend.color,
                borderRadius: '6px 6px 2px 2px',
                boxShadow: `0 0 12px ${trend.color}80`,
                transition: 'height 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
          <span style={{ fontSize: '0.57rem', color: trend.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
            прогноз
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div>
          <p style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>Прогноз (задач)</p>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: trend.color }}>{forecast.forecast}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>Доверит. интервал</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {forecast.confidenceInterval.low}–{forecast.confidenceInterval.high}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>Наклон β₁</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {forecast.trendSlope > 0 ? '+' : ''}{forecast.trendSlope}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>R² качество</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8b5cf6' }}>{forecast.rSquared}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <details>
            <summary
              style={{
                fontSize: '0.67rem',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              📐 Формула
            </summary>
            <p
              style={{
                marginTop: 4,
                fontSize: '0.65rem',
                color: 'var(--text-tertiary)',
                fontFamily: 'monospace',
                background: 'var(--border)',
                padding: '5px 8px',
                borderRadius: 6,
                whiteSpace: 'nowrap',
              }}
            >
              {forecast.modelFormula}
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
