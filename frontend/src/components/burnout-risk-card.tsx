'use client';

import type { BurnoutIndexPayload } from '@/lib/api';

interface BurnoutRiskCardProps {
  burnout: BurnoutIndexPayload;
}

const LEVEL_META: Record<
  BurnoutIndexPayload['level'],
  { label: string; color: string; bg: string; ring: string; emoji: string }
> = {
  low: {
    label: 'Низкий риск',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    ring: '#10b981',
    emoji: '🟢',
  },
  medium: {
    label: 'Умеренный риск',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    ring: '#f59e0b',
    emoji: '🟡',
  },
  high: {
    label: 'Высокий риск',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    ring: '#ef4444',
    emoji: '🔴',
  },
  critical: {
    label: 'Критический',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)',
    ring: '#dc2626',
    emoji: '🚨',
  },
};

function GaugeRing({ value, color }: { value: number; color: string }) {
  const r = 44;
  const cx = 56;
  const cy = 56;
  const circumference = 2 * Math.PI * r;
  // Only show the top 270° arc (from 135° to 405° = 225° to −45°)
  const arcLen = circumference * 0.75;
  const filled = arcLen * (value / 100);
  const gap = arcLen - filled;

  return (
    <svg width="112" height="112" viewBox="0 0 112 112" style={{ display: 'block' }}>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="10"
        strokeDasharray={`${arcLen} ${circumference - arcLen}`}
        strokeDashoffset={circumference * 0.125}
        strokeLinecap="round"
        style={{ transform: 'rotate(135deg)', transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Fill */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${filled} ${gap + circumference * 0.25}`}
        strokeDashoffset={circumference * 0.125}
        strokeLinecap="round"
        style={{
          transform: 'rotate(135deg)',
          transformOrigin: `${cx}px ${cy}px`,
          transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)',
          filter: `drop-shadow(0 0 6px ${color}66)`,
        }}
      />
      {/* Value */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize="22"
        fontWeight="800"
        fontFamily="var(--font-inter), system-ui, sans-serif"
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="var(--text-tertiary)"
        fontSize="9"
        fontFamily="var(--font-inter), system-ui, sans-serif"
      >
        / 100
      </text>
    </svg>
  );
}

export function BurnoutRiskCard({ burnout }: BurnoutRiskCardProps) {
  const meta = LEVEL_META[burnout.level];

  return (
    <section
      className="card glow-card animate-slide-up"
      style={{ padding: '22px', marginBottom: 14, background: meta.bg }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            🧨 Индекс выгорания
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            Когнитивная нагрузка · детекция перегрузки · рекомендации
          </p>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: meta.color,
            background: `${meta.color}18`,
            borderRadius: 999,
            padding: '3px 10px',
            border: `1px solid ${meta.color}40`,
          }}
        >
          {meta.emoji} {meta.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Gauge */}
        <div style={{ flexShrink: 0 }}>
          <GaugeRing value={burnout.burnoutIndex} color={meta.ring} />
        </div>

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 180 }}>
          {/* Factors */}
          {burnout.factors.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                ⚠️ Факторы риска
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {burnout.factors.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-primary)',
                      paddingLeft: 14,
                      position: 'relative',
                      lineHeight: 1.4,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        color: meta.color,
                        fontWeight: 700,
                      }}
                    >
                      ·
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {burnout.suggestions.length > 0 && (
            <div>
              <p style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                💡 Рекомендации
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {burnout.suggestions.map((s) => (
                  <li
                    key={s}
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-primary)',
                      paddingLeft: 14,
                      position: 'relative',
                      lineHeight: 1.4,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        color: '#10b981',
                        fontWeight: 700,
                      }}
                    >
                      ·
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Model formula */}
      <details style={{ marginTop: 14 }}>
        <summary
          style={{
            fontSize: '0.67rem',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          📐 Формула модели
        </summary>
        <p
          style={{
            marginTop: 6,
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            fontFamily: 'monospace',
            background: 'var(--border)',
            padding: '6px 10px',
            borderRadius: 8,
            wordBreak: 'break-all',
          }}
        >
          {burnout.modelFormula}
        </p>
      </details>
    </section>
  );
}
