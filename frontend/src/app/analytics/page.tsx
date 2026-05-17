import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ToastProvider } from '@/components/toast';
import { AnalyticsClient } from './analytics-client';
import type {
  ArchetypePayload,
  BurnoutIndexPayload,
  ExperimentReport,
  FocusDepthPayload,
  HabitCorrelationPayload,
  IntelligencePayload,
  ScenarioSimulatorPayload,
  VelocityForecastPayload,
} from '@/lib/api';

export const metadata = { title: 'Analytics — NeuroTrack' };

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

async function fetchJson<T>(token: string, path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json() as Promise<T>;
}

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nt_access')?.value;
  if (!token) redirect('/login');

  const [overview, scenarioSimulator, intelligence, experimentReport, burnout, archetype, velocityForecast, focusDepth, habitCorrelation] = await Promise.all([
    fetchJson<import('./analytics-client').OverviewPayload>(token, '/analytics/overview'),
    fetchJson<ScenarioSimulatorPayload>(token, '/analytics/scenario-simulator'),
    fetchJson<IntelligencePayload>(token, '/analytics/intelligence?energy=medium'),
    fetchJson<ExperimentReport>(token, '/analytics/experiment-report'),
    fetchJson<BurnoutIndexPayload>(token, '/analytics/burnout-risk'),
    fetchJson<ArchetypePayload>(token, '/analytics/productivity-archetype'),
    fetchJson<VelocityForecastPayload>(token, '/analytics/velocity-forecast'),
    fetchJson<FocusDepthPayload>(token, '/analytics/focus-depth'),
    fetchJson<HabitCorrelationPayload>(token, '/analytics/habit-task-correlation'),
  ]);

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', position: 'relative' }}>
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <Sidebar />
      <ToastProvider />
      <main className="main-content" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header className="animate-fade-in" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              📊
            </div>
            <div>
              <h1 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Аналитика
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
                Глубокий анализ вашей продуктивности
              </p>
            </div>
          </div>
        </header>

        <AnalyticsClient
          overview={overview}
          scenarioSimulator={scenarioSimulator}
          intelligence={intelligence}
          experimentReport={experimentReport}
          burnout={burnout}
          archetype={archetype}
          velocityForecast={velocityForecast}
          focusDepth={focusDepth}
          habitCorrelation={habitCorrelation}
          apiUrl={process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}
          token={token}
        />
      </main>
    </div>
  );
}
