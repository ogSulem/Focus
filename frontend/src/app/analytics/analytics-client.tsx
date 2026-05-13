'use client';

import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { YearlyHeatmap } from '@/components/yearly-heatmap';
import { HabitStatsCard } from '@/components/habit-stats-card';
import { ScenarioSimulatorCard } from '@/components/scenario-simulator-card';
import type { ScenarioSimulatorPayload } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProductivityPoint { date: string; completedTasksCount: number; totalTasksCount: number; }
export interface WeekDayPoint { day: string; fullDay: string; count: number; }
export interface OverviewPayload {
  summary: {
    tasks: { total: number; done: number; inProgress: number; todo: number; overdue: number; completionRate: number; avgCompletionDays: number | null };
    habits: { total: number; totalStreakDays: number; longestStreak: number; avgStreak: number };
    productivity: { bestDayOfWeek: string | null; avgDailyCompleted: number; peakHour: string | null };
  };
  monthly: ProductivityPoint[];
  trends: {
    completedTasks: { current: number; previous: number; changePercent: number };
    totalTasks: { current: number; previous: number; changePercent: number };
    habitCompletions: { current: number; previous: number; changePercent: number };
    trend: 'up' | 'down' | 'neutral';
  };
  activityBuckets: { morning: number; afternoon: number; evening: number; night: number };
  weekByDay: WeekDayPoint[];
  productivityScore: number;
}

// ─── Tooltip helpers ──────────────────────────────────────────────────────────
function AreaTip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-lg)', fontSize: '0.78rem' }}>
      <p style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</p>
      {payload.map((e) => (
        <p key={e.name} style={{ color: e.color, fontWeight: 600 }}>{e.name}: {e.value}</p>
      ))}
    </div>
  );
}

function BarTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WeekDayPoint; value: number }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--shadow-lg)', fontSize: '0.78rem' }}>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>{d.payload.fullDay}</p>
      <p style={{ color: '#6366f1', fontWeight: 700 }}>{d.value} задач выполнено</p>
    </div>
  );
}

// ─── Productivity Score Gauge ─────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  // Show only top 75% arc (270°)
  const arcLen = circ * 0.75;
  const dashOffset = arcLen * (1 - score / 100);
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Отлично' : score >= 50 ? 'Хорошо' : 'Нужно улучшить';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <svg width={140} height={120} viewBox="0 0 140 120">
        {/* Background arc */}
        <circle
          cx={70} cy={80} r={r}
          fill="none" stroke="var(--border)" strokeWidth={10}
          strokeDasharray={`${arcLen} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(135 70 80)"
        />
        {/* Animated foreground arc */}
        <circle
          cx={70} cy={80} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${arcLen} ${circ}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(135 70 80)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }}
        />
        {/* Score text */}
        <text x={70} y={78} textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" fontSize={26} fontWeight={800}>{score}</text>
        <text x={70} y={98} textAnchor="middle" dominantBaseline="middle" fill="var(--text-tertiary)" fontSize={9}>/100</text>
      </svg>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{label}</span>
    </div>
  );
}

// ─── Activity bars (time-of-day) ──────────────────────────────────────────────
function ActivityBars({ buckets }: { buckets: OverviewPayload['activityBuckets'] }) {
  const entries: { label: string; emoji: string; key: keyof typeof buckets; color: string }[] = [
    { label: 'Утро 6–12', emoji: '🌅', key: 'morning',   color: '#f59e0b' },
    { label: 'День 12–18', emoji: '☀️', key: 'afternoon', color: '#6366f1' },
    { label: 'Вечер 18–0', emoji: '🌆', key: 'evening',  color: '#8b5cf6' },
    { label: 'Ночь 0–6', emoji: '🌙',  key: 'night',     color: '#6b7280' },
  ];
  const max = Math.max(...entries.map((e) => buckets[e.key]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
      {entries.map((e) => {
        const val = buckets[e.key];
        const pct = Math.round((val / max) * 100);
        return (
          <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1rem', width: 20, flexShrink: 0 }}>{e.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{e.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{val}</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, background: e.color,
                  width: `${pct}%`, transition: 'width 0.8s var(--ease)',
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── KPI Stat mini card ───────────────────────────────────────────────────────
function MiniStat({ label, value, sub, emoji, accent }: { label: string; value: string | number; sub?: string; emoji: string; accent: string }) {
  return (
    <div className="card animate-scale-in" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{emoji}</div>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</span>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-tertiary)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Нет данных для анализа</h2>
      <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>Войдите в аккаунт и начните добавлять задачи — через неделю здесь появятся ваши инсайты.</p>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────
export function AnalyticsClient({
  overview,
  scenarioSimulator,
  apiUrl,
  token,
}: {
  overview: OverviewPayload | null;
  scenarioSimulator?: ScenarioSimulatorPayload | null;
  apiUrl?: string;
  token?: string;
}) {
  if (!overview) return <EmptyState />;

  const { summary, monthly, trends, activityBuckets, weekByDay, productivityScore } = overview;

  // Format monthly dates for readability
  const monthlyFormatted = monthly.map((p) => ({
    ...p,
    date: new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }));

  // WoW comparison data
  const wowItems = [
    { label: 'Выполнено задач', current: trends.completedTasks.current, previous: trends.completedTasks.previous, pct: trends.completedTasks.changePercent },
    { label: 'Всего задач', current: trends.totalTasks.current, previous: trends.totalTasks.previous, pct: trends.totalTasks.changePercent },
    { label: 'Привычки выполнены', current: trends.habitCompletions.current, previous: trends.habitCompletions.previous, pct: trends.habitCompletions.changePercent },
  ];

  const maxBarCount = Math.max(...weekByDay.map((d) => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Row 1: Score + KPIs ── */}
      <section className="stagger analytics-score-row">
        {/* Score Gauge */}
        <div className="card animate-fade-in glow-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 160 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Productivity Score</p>
          <ScoreGauge score={productivityScore} />
        </div>
        <MiniStat label="Completion Rate" value={`${summary.tasks.completionRate}%`} sub={`${summary.tasks.done}/${summary.tasks.total} задач`} emoji="🎯" accent="#6366f1" />
        <MiniStat label="Streak лучший" value={`${summary.habits.longestStreak}д`} sub={`avg ${summary.habits.avgStreak}д`} emoji="🔥" accent="#f59e0b" />
        <MiniStat label="Среднее в день" value={summary.productivity.avgDailyCompleted} sub="задач (30 дней)" emoji="⚡" accent="#10b981" />
        <MiniStat
          label="Пик активности"
          value={summary.productivity.peakHour ?? '—'}
          sub={summary.productivity.bestDayOfWeek ? `Лучший день: ${summary.productivity.bestDayOfWeek}` : 'Накапливаем данные'}
          emoji="🕐"
          accent="#8b5cf6"
        />
      </section>

      {/* ── Row 2: 30-day chart + day-of-week chart ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 14 }}>
        {/* 30-day trend */}
        <div className="card glow-card animate-slide-up stagger-1" style={{ padding: '22px' }}>
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 2 }}>Тренд за 30 дней</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>Динамика создания и выполнения задач</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFormatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ac-grad-done" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ac-grad-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} tick={{ fill: 'var(--text-tertiary)' }} interval={4} />
                <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: 'var(--text-tertiary)' }} />
                <Tooltip content={<AreaTip />} />
                <Area type="monotone" dataKey="totalTasksCount" stroke="#8b5cf6" strokeWidth={2} fill="url(#ac-grad-total)" dot={false} name="Всего" />
                <Area type="monotone" dataKey="completedTasksCount" stroke="#6366f1" strokeWidth={2.5} fill="url(#ac-grad-done)" dot={false} activeDot={{ r: 4 }} name="Выполнено" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day-of-week chart */}
        <div className="card glow-card animate-slide-up stagger-2" style={{ padding: '22px' }}>
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 2 }}>Лучшие дни недели</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>Выполненные задачи по дням</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: 'var(--text-tertiary)' }} />
                <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: 'var(--text-tertiary)' }} />
                <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Задач">
                  {weekByDay.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count === maxBarCount ? '#6366f1' : `rgba(99,102,241,${0.35 + (entry.count / maxBarCount) * 0.45})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── Row 3: Time-of-day + WoW comparison ── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Time-of-day distribution */}
        <div className="card glow-card animate-slide-up stagger-3" style={{ padding: '22px' }}>
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 2 }}>Активность по времени суток</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 18 }}>Когда вы наиболее продуктивны</p>
          <ActivityBars buckets={activityBuckets} />
        </div>

        {/* Week-over-week comparison */}
        <div className="card glow-card animate-slide-up stagger-4" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Сравнение по неделям</h2>
            <span className={`badge badge-${trends.trend === 'up' ? 'done' : trends.trend === 'down' ? 'high' : 'todo'}`} style={{ fontSize: '0.65rem' }}>
              {trends.trend === 'up' ? '📈 Рост' : trends.trend === 'down' ? '📉 Снижение' : '→ Стабильно'}
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 18 }}>Эта неделя vs прошлая неделя</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {wowItems.map((item) => {
              const up = item.pct > 0;
              const neutral = item.pct === 0;
              const color = neutral ? 'var(--text-tertiary)' : up ? '#10b981' : '#ef4444';
              const bg = neutral ? 'var(--border)' : up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
              const arrow = neutral ? '—' : up ? '↑' : '↓';
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--border)', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{item.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{item.current} (было {item.previous})</p>
                  </div>
                  <span style={{ background: bg, color, borderRadius: 999, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                    {arrow} {Math.abs(item.pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Row 4: Task health summary ── */}
      <section className="card glow-card animate-slide-up stagger-5" style={{ padding: '22px' }}>
        <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 2 }}>Состояние задач</h2>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 18 }}>Обзор вашего бэклога</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Всего', value: summary.tasks.total, color: '#6366f1' },
            { label: 'Выполнено', value: summary.tasks.done, color: '#10b981' },
            { label: 'В процессе', value: summary.tasks.inProgress, color: '#f59e0b' },
            { label: 'Запланировано', value: summary.tasks.todo, color: '#6b7280' },
            { label: 'Просрочено', value: summary.tasks.overdue, color: '#ef4444' },
            { label: 'Среднее время', value: summary.tasks.avgCompletionDays !== null ? `${summary.tasks.avgCompletionDays}д` : '—', color: '#8b5cf6' },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: '14px 16px', borderRadius: 12,
              background: `${stat.color}0d`,
              border: `1px solid ${stat.color}22`,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: 4 }}>{stat.value}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Row 5: Habit statistics ── */}
      <HabitStatsCard />

      {/* ── Row 6: What-if scenario simulator ── */}
      {scenarioSimulator && <ScenarioSimulatorCard scenarioSimulator={scenarioSimulator} />}

      {/* ── Row 7: Activity heatmap ── */}
      {(apiUrl && token) && (
        <section className="card glow-card animate-slide-up stagger-5" style={{ padding: '22px', overflowX: 'auto' }}>
          <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 2 }}>Активность за год</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 18 }}>GitHub-style тепловая карта: задачи + привычки</p>
          <YearlyHeatmap apiUrl={apiUrl} token={token} />
        </section>
      )}

    </div>
  );
}
