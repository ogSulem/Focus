'use client';

import type { ExperimentReport } from '@/lib/api';

interface ExperimentReportCardProps {
  report: ExperimentReport;
}

function deltaTone(value: number, inverse = false): { color: string; sign: string } {
  const positive = inverse ? value < 0 : value > 0;
  if (value === 0) return { color: 'var(--text-tertiary)', sign: '±' };
  return { color: positive ? '#10b981' : '#ef4444', sign: value > 0 ? '+' : '' };
}

function MetricRow({
  label,
  before,
  after,
  delta,
  inverse,
}: {
  label: string;
  before: number;
  after: number;
  delta: number;
  inverse?: boolean;
}) {
  const tone = deltaTone(delta, inverse);
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-base)', padding: '10px 12px' }}>
      <p style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>{label}</p>
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
          {before} → {after}
        </p>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: tone.color }}>
          {tone.sign}
          {delta}
        </p>
      </div>
    </div>
  );
}

export function ExperimentReportCard({ report }: ExperimentReportCardProps) {
  return (
    <section className="card glow-card animate-slide-up" style={{ padding: '22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            🧪 Научный блок (before/after)
          </h2>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
            Последние 14 дней: сравнение 7 дней до и 7 дней после
          </p>
        </div>
        <span className="badge badge-progress" style={{ fontSize: '0.68rem' }}>
          measurable impact
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        <MetricRow
          label="Выполненные задачи"
          before={report.before.completedTasks}
          after={report.after.completedTasks}
          delta={report.delta.completedTasks}
        />
        <MetricRow
          label="Completion rate (%)"
          before={report.before.completionRate}
          after={report.after.completionRate}
          delta={report.delta.completionRate}
        />
        <MetricRow
          label="Просроченные открытые"
          before={report.before.overdueOpenTasks}
          after={report.after.overdueOpenTasks}
          delta={report.delta.overdueOpenTasks}
          inverse
        />
        <MetricRow
          label="Habit completions"
          before={report.before.habitCompletions}
          after={report.after.habitCompletions}
          delta={report.delta.habitCompletions}
        />
        <MetricRow
          label="Focus minutes"
          before={report.before.focusMinutes}
          after={report.after.focusMinutes}
          delta={report.delta.focusMinutes}
        />
      </div>
    </section>
  );
}
