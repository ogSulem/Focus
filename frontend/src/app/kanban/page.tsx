import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ToastProvider } from '@/components/toast';
import { KanbanBoard } from './kanban-client';
import { getDashboardData } from '@/lib/api';

export const metadata = { title: 'Kanban — Focus' };

export default async function KanbanPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nt_access')?.value;

  if (!token) {
    redirect('/login');
  }

  const data = await getDashboardData(token);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
        <header className="animate-fade-in" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              📋
            </div>
            <div>
              <h1 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Kanban Board
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
                Перетащите задачи между колонками для смены статуса
              </p>
            </div>
          </div>
        </header>
        <KanbanBoard initialTasks={data.tasks} apiUrl={apiUrl} token={token} />
      </main>
    </div>
  );
}
