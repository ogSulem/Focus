import { cookies } from 'next/headers';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { StatCard } from '@/components/stat-card';
import { ProductivityChart } from '@/components/productivity-chart';
import { TaskFilterBar } from '@/components/task-filter-bar';
import { HabitListManager } from '@/components/habit-list-manager';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { YearlyHeatmap } from '@/components/yearly-heatmap';
import { FocusTimer } from '@/components/focus-timer';
import { DonutChart } from '@/components/donut-chart';
import { QuickAddTask } from '@/components/quick-add-task';
import { CommandPalette } from '@/components/command-palette';
import { ToastProvider } from '@/components/toast';
import { WelcomeBanner } from '@/components/welcome-banner';
import { DailyGoalWidget } from '@/components/daily-goal-widget';
import { WeeklyTrendsCard } from '@/components/weekly-trends-card';
import { AnalyticsSummaryCard } from '@/components/analytics-summary-card';
import { GlobalKeyShortcuts } from '@/components/global-key-shortcuts';
import { AchievementsCard } from '@/components/achievements-card';
import { NotificationBell } from '@/components/notification-bell';
import { UpcomingDeadlinesWidget } from '@/components/upcoming-deadlines-widget';
import { getDashboardData } from '@/lib/api';
import { OnboardingModal } from '@/components/onboarding-modal';
import { DeadlineNotifier } from '@/components/deadline-notifier';
import { IntelligenceStoryCard } from '@/components/intelligence-story-card';
import { ExperimentReportCard } from '@/components/experiment-report-card';
import { BurnoutRiskCard } from '@/components/burnout-risk-card';
import { ArchetypeCard } from '@/components/archetype-card';
import { VelocityForecastCard } from '@/components/velocity-forecast-card';
import { FocusDepthCard } from '@/components/focus-depth-card';
import { HabitCorrelationCard } from '@/components/habit-correlation-card';
import { ScenarioSimulatorCard } from '@/components/scenario-simulator-card';
import { TaskDeadlineCalendar } from '@/components/task-deadline-calendar';
import { DiplomaComplianceCard } from '@/components/diploma-compliance-card';

export default async function Home() {
  // Read access token from the secure httpOnly cookie set by /api/auth/set
  const cookieStore = await cookies();
  const token = cookieStore.get('nt_access')?.value;
  const data = await getDashboardData(token);

  const doneTasks = data.tasks.filter((t) => t.status === 'DONE').length;
  const totalTasks = data.tasks.length;
  const inProgressTasks = data.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoTasks = data.tasks.filter((t) => t.status === 'TODO').length;
  const completion = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const highPriority = data.tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE').length;
  const totalStreak = data.habits.reduce((acc, h) => acc + h.streak, 0);

  // Due today
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueTodayTasks = data.tasks.filter((t) => t.deadline && t.deadline.slice(0, 10) === todayStr && t.status !== 'DONE');

  // Sparkline data from weekly chart
  const completedSparkline = data.weekly.map((w) => w.completedTasksCount);
  const totalSparkline = data.weekly.map((w) => w.totalTasksCount);

  // Week-over-week trend for completed tasks
  const wLen = data.weekly.length;
  const weeklyTrend =
    wLen >= 2 && data.weekly[wLen - 2].completedTasksCount > 0
      ? Math.round(
          ((data.weekly[wLen - 1].completedTasksCount -
            data.weekly[wLen - 2].completedTasksCount) /
            data.weekly[wLen - 2].completedTasksCount) *
            100,
        )
      : null;

  // Productivity score: 50% completion rate + 30% habit streaks (capped at 30d avg) + 20% velocity
  const avgStreak = data.habits.length > 0 ? totalStreak / data.habits.length : 0;
  const velocityScore = wLen > 0 ? Math.min((data.weekly[wLen - 1].completedTasksCount / 5) * 100, 100) : 0;
  const productivityScore = Math.round(
    completion * 0.5 + Math.min((avgStreak / 14) * 100, 100) * 0.3 + velocityScore * 0.2,
  );
  const scoreColor = productivityScore >= 70 ? '#10b981' : productivityScore >= 40 ? '#f59e0b' : '#ef4444';
  const scoreTier = productivityScore >= 70 ? 'Высокая' : productivityScore >= 40 ? 'Средняя' : 'Низкая';

  const statusDonut = [
    { name: 'Готово', value: doneTasks, color: '#10b981' },
    { name: 'В процессе', value: inProgressTasks, color: '#f59e0b' },
    { name: 'Запланировано', value: todoTasks, color: '#6366f1' },
  ];

  const priorityDonut = [
    { name: 'Высокий', value: data.tasks.filter((t) => t.priority === 'HIGH').length, color: '#ef4444' },
    { name: 'Средний', value: data.tasks.filter((t) => t.priority === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'Низкий', value: data.tasks.filter((t) => t.priority === 'LOW').length, color: '#10b981' },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', position: 'relative' }}>
      {/* Ambient animated background blobs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      <Sidebar />
      <ToastProvider />
      <OnboardingModal />
      <DeadlineNotifier tasks={data.tasks} />
      <CommandPalette tasks={data.tasks} habits={data.habits} />
      <GlobalKeyShortcuts />

      <main className="main-content" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* ── Header ── */}
        <header className="animate-fade-in" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="gradient-text" style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}>
                NeuroTrack
              </h1>
              <span className={`badge badge-${data.mode === 'demo' ? 'progress' : 'done'}`} style={{ fontSize: '0.68rem' }}>
                {data.mode === 'demo' ? 'Demo' : '● Live'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Productivity score badge */}
              <div
                title={`Индекс продуктивности: ${productivityScore}/100 (${scoreTier})`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  background: `${scoreColor}18`,
                  border: `1px solid ${scoreColor}40`,
                  fontSize: '0.72rem', fontWeight: 700,
                  color: scoreColor,
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: '0.75rem' }}>⚡</span>
                {productivityScore}
              </div>

              <NotificationBell tasks={data.tasks} />

              <button
                className="btn btn-ghost"
                style={{ gap: 6, fontSize: '0.78rem', padding: '6px 12px' }}
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
                }}
                suppressHydrationWarning
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Поиск
                <kbd style={{ fontFamily: 'monospace', fontSize: '0.65rem', background: 'var(--border)', borderRadius: 4, padding: '1px 5px' }}>⌘K</kbd>
              </button>

              {data.mode === 'demo' && (
                <div className="card animate-scale-in" style={{ padding: '6px 12px', borderRadius: 10 }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    💡 <a href="/login" style={{ color: 'var(--accent-1)', textDecoration: 'none', fontWeight: 600 }}>Войти</a> для работы с реальными данными
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Welcome Banner ── */}
        <WelcomeBanner
          doneTasks={doneTasks}
          totalTasks={totalTasks}
          totalStreak={totalStreak}
          habitsCount={data.habits.length}
          todayProgress={completion}
          weekly={data.weekly}
          userName={data.user?.name ?? data.user?.email?.split('@')[0] ?? null}
        />

        {/* ── Due Today callout ── */}
        {dueTodayTasks.length > 0 && (
          <div className="animate-slide-up" style={{
            marginBottom: 14, padding: '12px 18px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(245,158,11,0.08) 100%)',
            border: '1px solid rgba(239,68,68,0.22)',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🔔</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ef4444', marginBottom: 2 }}>
                Сегодня дедлайн: {dueTodayTasks.length} {dueTodayTasks.length === 1 ? 'задача' : 'задачи'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dueTodayTasks.slice(0, 3).map((t) => t.title).join(' · ')}{dueTodayTasks.length > 3 ? ` +${dueTodayTasks.length - 3}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="animate-fade-in" style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
          animationDelay: '40ms',
        }}>
          <button
            data-shortcut="new-task"
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
            onClick={() => {
              const btn = document.querySelector<HTMLButtonElement>('[data-qa="open-quick-add-task"]');
              if (btn) btn.click();
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Новая задача
          </button>
          <button
            data-shortcut="new-habit"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
            onClick={() => {
              const btn = document.querySelector<HTMLButtonElement>('[data-qa="open-quick-add-habit"]');
              if (btn) btn.click();
            }}
          >
            <span aria-hidden="true">✨</span>
            Новая привычка
          </button>
          <Link
            href="/focus"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '7px 14px', textDecoration: 'none' }}
          >
            <span aria-hidden="true">⏱</span>
            Режим фокуса
          </Link>
          <Link
            href="/kanban"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '7px 14px', textDecoration: 'none' }}
          >
            <span aria-hidden="true">📋</span>
            Канбан
          </Link>
        </div>

        {/* ── KPI Cards ── */}
        <section className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard
            label="Выполнено"
            value={`${doneTasks}/${totalTasks}`}
            subtitle={`${completion}% задач`}
            icon="✅"
            accent="#10b981"
            delay={0}
            sparkline={completedSparkline}
            trend={weeklyTrend !== null ? { value: weeklyTrend, label: 'нед.' } : undefined}
          />
          <StatCard label="В процессе" value={inProgressTasks} subtitle="Активных" icon="⚡" accent="#f59e0b" delay={60} sparkline={totalSparkline} />
          <StatCard label="Высокий приоритет" value={highPriority} subtitle="Срочных" icon="🔴" accent="#ef4444" delay={120} />
          <StatCard label="Streak суммарно" value={`${totalStreak}д`} subtitle={`${data.habits.length} привычек`} icon="🔥" accent="#f59e0b" delay={180} />
          <StatCard label="Completion Rate" value={`${completion}%`} subtitle="За период" icon="🎯" accent="#6366f1" delay={240} sparkline={completedSparkline} />
        </section>

        {/* ── Chart + Focus Timer ── */}
        <section className="dashboard-grid-2col">
          <div className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '80ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 2 }}>Продуктивность</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Выполненные vs всего задач</p>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: '#6366f1', display: 'inline-block' }} /> Выполнено
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: '#8b5cf6', display: 'inline-block', opacity: 0.5 }} /> Всего
                </span>
              </div>
            </div>
            <ProductivityChart data={data.weekly} />
          </div>

          <div id="focus-timer" className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '140ms', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Focus Timer</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Pomodoro 25 / 5 / 15 · <kbd style={{ background: 'var(--border)', borderRadius: 4, padding: '1px 4px', fontFamily: 'monospace', fontSize: '0.65rem' }}>Space</kbd> старт/пауза</p>
            <FocusTimer />
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 12 }}>
              <DailyGoalWidget completedToday={doneTasks} totalTasks={totalTasks} />
            </div>
          </div>
        </section>

        {/* ── Donut Charts ── */}
        <section className="dashboard-grid-equal">
          <div className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '100ms' }}>
            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 2 }}>По статусу</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>Распределение задач</p>
            <DonutChart data={statusDonut} centerValue={`${completion}%`} label="выполнено" />
          </div>
          <div className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '130ms' }}>
            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 2 }}>По приоритету</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>Срочность задач</p>
            <DonutChart data={priorityDonut} centerValue={totalTasks} label="задач" />
          </div>
        </section>

        {/* ── Upcoming Deadlines ── */}
        <UpcomingDeadlinesWidget apiUrl={apiUrl} token={token} />

        {/* ── Deadline Calendar (new) ── */}
        <TaskDeadlineCalendar tasks={data.tasks} />

        {/* ── Diploma Compliance Matrix (new) ── */}
        <DiplomaComplianceCard />

        {/* ── Tasks + Habits ── */}
        <section id="tasks-section" className="dashboard-grid-equal">
          {/* Tasks */}
          <div className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '160ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Задачи</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{totalTasks} задач всего</p>
              </div>
              <QuickAddTask apiUrl={apiUrl} token={token} />
            </div>
            {/* Progress bar */}
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent-gradient)', width: `${completion}%`, transition: 'width 0.8s var(--ease)' }} />
            </div>
            <TaskFilterBar tasks={data.tasks} apiUrl={apiUrl} token={token} />
          </div>

          {/* Habits */}
          <div id="habits-section" className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '200ms' }}>
            <HabitListManager habits={data.habits} apiUrl={apiUrl} token={token} />
          </div>
        </section>

        {/* ── Weekly Trends ── */}
        <section style={{ marginBottom: 14 }}>
          <WeeklyTrendsCard apiUrl={apiUrl} token={token} />
        </section>

        {/* ── Intelligence Storytelling ── */}
        <IntelligenceStoryCard intelligence={data.intelligence} />

        {/* ── Annual Activity Heatmap ── */}
        <YearlyHeatmap apiUrl={apiUrl} token={token} />

        {/* ── Per-habit Heatmap ── */}
        {data.habits.length > 0 && (
          <section id="heatmap-section" className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '240ms', marginBottom: 14 }}>
            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 2 }}>История привычек</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Выполнение привычек за последние 18 недель
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, overflowX: 'auto', paddingBottom: 4 }}>
              {data.habits.map((habit) => (
                <ActivityHeatmap key={habit.id} completedDays={habit.completedDays} habitName={habit.name} />
              ))}
            </div>
          </section>
        )}

        {/* ── Analytics Summary ── */}
        <AnalyticsSummaryCard apiUrl={apiUrl} token={token} />

        {/* ── Experiment Report ── */}
        <ExperimentReportCard report={data.experimentReport} />

        {/* ── Burnout Risk Index ── */}
        <BurnoutRiskCard burnout={data.burnout} />

        {/* ── Productivity Archetype ── */}
        <ArchetypeCard archetype={data.archetype} />

        {/* ── Velocity Forecast ── */}
        <VelocityForecastCard forecast={data.velocityForecast} />

        {/* ── Focus Depth & Flow State ── */}
        <FocusDepthCard focusDepth={data.focusDepth} />

        {/* ── Habit–Task Correlation ── */}
        <HabitCorrelationCard habitCorrelation={data.habitCorrelation} />

        {/* ── What-if Scenario Simulator ── */}
        <ScenarioSimulatorCard scenarioSimulator={data.scenarioSimulator} />

        {/* ── Achievements & Gamification ── */}
        <section id="ai-section" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
          <AchievementsCard />
        </section>

        {/* ── AI Recommendations ── */}
        <section id="ai-recs" className="card glow-card animate-slide-up" style={{ padding: '22px', animationDelay: '280ms', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            }}>
              🧠
            </div>
            <div>
              <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>AI-инсайты</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Персональные рекомендации на основе ваших данных</p>
            </div>
          </div>

          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {data.recommendations.recommendations.map((rec, i) => (
              <div
                key={rec}
                className="animate-scale-in gradient-border"
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: `rgba(99,102,241,${0.04 + i * 0.02})`,
                  border: '1px solid rgba(99,102,241,0.10)',
                  fontSize: '0.85rem',
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                  transition: 'transform 0.2s var(--ease), box-shadow 0.2s var(--ease)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {rec}
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ textAlign: 'center', padding: '12px 0 4px', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
          NeuroTrack · AI Productivity System · v10.0
          <span style={{ marginLeft: 12 }}>
            <kbd style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: 'var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-tertiary)' }}>⌘K</kbd> поиск ·&nbsp;
            <kbd style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: 'var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-tertiary)' }}>N</kbd> задача ·&nbsp;
            <kbd style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: 'var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-tertiary)' }}>?</kbd> шорткаты ·&nbsp;
            <kbd style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: 'var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--text-tertiary)' }}>T</kbd> вверх
          </span>
        </footer>
      </main>
    </div>
  );
}
