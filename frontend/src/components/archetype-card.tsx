'use client';

import type { ArchetypePayload } from '@/lib/api';

interface ArchetypeCardProps {
  archetype: ArchetypePayload;
}

const ARCHETYPE_META: Record<
  string,
  { emoji: string; gradient: string; accent: string }
> = {
  MORNING_PEAK: {
    emoji: '🌅',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(251,191,36,0.06) 100%)',
    accent: '#f59e0b',
  },
  DEADLINE_DRIVEN: {
    emoji: '⏰',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(245,158,11,0.06) 100%)',
    accent: '#ef4444',
  },
  DEEP_WORK_FOCUSED: {
    emoji: '🧠',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)',
    accent: '#6366f1',
  },
  HABIT_BUILDER: {
    emoji: '🔗',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(5,150,105,0.06) 100%)',
    accent: '#10b981',
  },
  BALANCED: {
    emoji: '⚖️',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(99,102,241,0.06) 100%)',
    accent: '#8b5cf6',
  },
  UNKNOWN: {
    emoji: '🔍',
    gradient: 'linear-gradient(135deg, rgba(107,114,128,0.10) 0%, rgba(107,114,128,0.04) 100%)',
    accent: '#6b7280',
  },
};

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 5,
          background: 'var(--border)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: color,
            borderRadius: 99,
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color, minWidth: 32 }}>
        {value}%
      </span>
    </div>
  );
}

export function ArchetypeCard({ archetype }: ArchetypeCardProps) {
  const meta = ARCHETYPE_META[archetype.archetype] ?? ARCHETYPE_META['BALANCED'];

  return (
    <section
      className="card glow-card animate-slide-up"
      style={{ padding: '22px', marginBottom: 14, background: meta.gradient }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            🎭 Профиль продуктивности
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
            Классификация поведенческого паттерна
          </p>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: meta.accent,
            background: `${meta.accent}18`,
            borderRadius: 999,
            padding: '3px 10px',
            border: `1px solid ${meta.accent}40`,
          }}
        >
          confidence {archetype.confidence}%
        </span>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Archetype icon block */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 22,
            background: `${meta.accent}18`,
            border: `2px solid ${meta.accent}40`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>{meta.emoji}</span>
        </div>

        {/* Description */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: meta.accent,
              marginBottom: 6,
              letterSpacing: '-0.01em',
            }}
          >
            {archetype.label}
          </h3>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: 12,
              maxWidth: 400,
            }}
          >
            {archetype.description}
          </p>

          {/* Traits */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {archetype.traits.map((trait) => (
              <span
                key={trait}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: meta.accent,
                  background: `${meta.accent}14`,
                  borderRadius: 999,
                  padding: '3px 10px',
                  border: `1px solid ${meta.accent}30`,
                }}
              >
                {trait}
              </span>
            ))}
          </div>

          {/* Peak window */}
          {archetype.peakWindow && (
            <p style={{ marginTop: 8, fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>
              🕐 Пиковое окно: <strong style={{ color: 'var(--text-primary)' }}>{archetype.peakWindow}</strong>
            </p>
          )}
        </div>

        {/* Raw scores radar-style */}
        {archetype.rawScores && (
          <div
            style={{
              minWidth: 180,
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
              Факторные баллы
            </p>
            {([
              ['🌅 Утренний пик', archetype.rawScores.morningPeak],
              ['⏰ Дедлайн', archetype.rawScores.deadlineDriven],
              ['🧠 Deep Work', archetype.rawScores.deepWork],
              ['🔗 Привычки', archetype.rawScores.habitBuilder],
            ] as [string, number][]).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)' }}>{label}</span>
                <ConfidenceBar value={Math.round(val)} color={meta.accent} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
