import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ToastProvider } from '@/components/toast';
import { SettingsClient } from './settings-client';

export const metadata = { title: 'Настройки — Focus' };

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nt_access')?.value;

  if (!token) {
    redirect('/login');
  }

  const API_URL =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api';

  const profileRes = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);

  const profile = profileRes?.ok
    ? ((await profileRes.json()) as { id: string; email: string; name: string | null; createdAt: string })
    : null;

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', position: 'relative' }}>
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <Sidebar />
      <ToastProvider />
      <main
        className="main-content"
        style={{ flex: 1, position: 'relative', zIndex: 1 }}
      >
        <SettingsClient profile={profile} apiUrl={process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'} token={token} />
      </main>
    </div>
  );
}
