import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FocusModeClient } from './focus-client';
import { getDashboardData } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Focus Mode — Focus',
  description: 'Distraction-free deep work mode',
};

export default async function FocusPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nt_access')?.value;

  if (!token) {
    redirect('/login');
  }

  const data = await getDashboardData(token);
  const pendingTasks = data.tasks.filter((t) => t.status !== 'DONE');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

  return <FocusModeClient tasks={pendingTasks} apiUrl={apiUrl} token={token} />;
}
