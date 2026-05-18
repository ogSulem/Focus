import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ToastProvider } from '@/components/toast';
import { NotesClient } from './notes-client';

export const metadata = { title: 'Заметки — Focus' };

export default async function NotesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nt_access')?.value;
  if (!token) redirect('/login');

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
        <NotesClient token={token} />
      </main>
    </div>
  );
}
