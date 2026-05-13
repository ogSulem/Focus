'use client';

import type { FocusDepthPayload } from '@/lib/api';

interface FocusDepthCardProps {
  focusDepth: FocusDepthPayload;
}

const LEVEL_META: Record<
  FocusDepthPayload['level'],
  { label: string; color: string; bg: string; emoji: string; desc: string }
> = {
  none: {
    label: 'Нет данных',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.08)',
    emoji: '💤',
    desc: 'Начните записывать фокус-сессии',
  },
  distracted: {
    label: 'Рассеянное внимание',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.07)',
    emoji: '😵',
    desc: 'Слишком мало или слишком короткие сессии',
  },
  shallow: {
    label: 'Поверхностная работа',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    emoji: '🤔',
    desc: 'Работа есть, но глубина невысокая',
  },
  flow: {
    label: 'Состояние потока',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    emoji: '⚡',
    desc: 'Стабильный поток — продолжайте в том же духе',
  },
  'deep-flow': {
    label: 'Глубокий поток',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    emoji: '🧘',
    desc: 'Пиковое когнитивное состояние — Csikszentmihalyi-уровень',
  },
};

const BLOCK_COLORS: Record<string, string> = {
  night:     '#6366f1',
  morning:   '#f59e0b',
  afternoon: '#10b981',
  evening:   '#8b5cf6',
};

function FlowGauge({ score, color }: { score: number; color: string }) {
  const r = 50;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  const arcLen = circumference * 0.75; // 270° arc
  const filled = arcLen * (score / 100);

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block' }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="9"
        strokeDasharray={`${arcLen} ${circumference - arcLen}`}
        strokeDashoffset={circumference * 0.125}
        strokeLinecap="round"
        style={{ transform: 'rotate(135deg)', transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeDasharray={`${filled} ${arcLen - filled + circumference * 0.25}`}
        strokeDashoffset={circumference * 0.125}
        strokeLinecap="round"
        style={{
          transform: 'rotate(135deg)',
          transformOrigin: `${cx}px ${cy}px`,
          transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)',
          filter: `drop-shadow(0 0 6px ${color}88)`,
        }}
      />
      <text x={cx} y={cx - 5} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="22" fontWeight="800"
        fontFamily="var(--font-inter), system-ui, sans-serif">
        {score}
      </text>
      <text x={cx} y={cx + 13} textAnchor="middle" fill="var(--text-tertiary)"
        fontSize="8" fontFamily="var(--font-inter), system-ui, sans-serif">
        / 100
      </text>
    </svg>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color, borderRadius: 99,
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 0 6px ${color}66`,
      }} />
    </div>
  );
}

export function FocusDepthCard({ focusDepth }: FocusDepthCardProps) {
  const meta = LEVEL_META[focusDepth.level];
  const maxBlock = Math.max(...focusDepth.hourBlocks.map((b) => b.count), 1);

  return (
    <section
      className="card glow-card animate-slide-up"
      style={{ padding: '22px', marginBottom: 14, background: meta.bg }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            🌊 Глубина фокуса и Flow State
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            Модель Чиксентмихайи · Deep Work Index · анализ 30 дней
          </p>
        </div>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: meta.color,
          background: `${meta.color}18`,
          borderRadius: 999, padding: '3px 10px',
          border: `1px solid ${meta.color}40`,
        }}>
          {meta.emoji} {meta.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Gauge */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <FlowGauge score={focusDepth.flowStateScore} color={meta.color} />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: 100 }}>
            {meta.desc}
          </span>
        </div>

        {/* Stats grid */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 14 }}>
            {([
              ['🕐 Средняя сессия', `${focusDepth.avgSessionMin} мин`, meta.color],
              ['🔥 Страйк сессий', `${focusDepth.longestStreakDays} дней`, '#f59e0b'],
              ['🧠 Deep Work', `${focusDepth.deepWorkIndex}%`, '#6366f1'],
              ['📅 Регулярность', `${focusDepth.sessionConsistency}%`, '#10b981'],
            ] as [string, string, string][]).map(([label, val, clr]) => (
              <div key={label}>
                <p style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: clr }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Hour blocks */}
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            ⏰ Сессии по времени суток
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {focusDepth.hourBlocks.map((block) => (
              <div key={block.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: '0.65rem', minWidth: 78,
                  color: block.isPeak ? BLOCK_COLORS[block.key] : 'var(--text-tertiary)',
                  fontWeight: block.isPeak ? 700 : 400,
                }}>
                  {block.label}{block.isPeak ? ' ★' : ''}
                </span>
                <MiniBar value={block.count} max={maxBlock} color={BLOCK_COLORS[block.key]} />
                <span style={{ fontSize: '0.65rem', minWidth: 16, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                  {block.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      {focusDepth.insights.length > 0 && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {focusDepth.insights.map((insight) => (
            <p key={insight} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              💡 {insight}
            </p>
          ))}
        </div>
      )}

      {/* Formula */}
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', cursor: 'pointer', userSelect: 'none' }}>
          📐 Формула Flow State
        </summary>
        <p style={{
          marginTop: 5, fontSize: '0.65rem', fontFamily: 'monospace',
          color: 'var(--text-tertiary)',
          background: 'var(--border)', padding: '5px 8px',
          borderRadius: 7, wordBreak: 'break-all',
        }}>
          {focusDepth.modelFormula}
        </p>
      </details>
    </section>
  );
}
