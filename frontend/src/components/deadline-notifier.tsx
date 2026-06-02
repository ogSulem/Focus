'use client';

import { useEffect, useRef, useState } from 'react';
import type { Task } from '@/lib/api';

interface DeadlineNotifierProps {
  tasks: Task[];
}

/**
 * Silently fires browser notifications for tasks that are:
 * - overdue (deadline < now) and not DONE
 * - due within the next 24 hours and not DONE
 *
 * Uses localStorage to avoid re-notifying in the same session.
 */
export function DeadlineNotifier({ tasks }: DeadlineNotifierProps) {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;

    const pendingTasks = tasks.filter((t) => {
      if (t.status === 'DONE') return false;
      if (!t.deadline) return false;
      const dl = new Date(t.deadline).getTime();
      return dl <= in24h;
    });

    for (const task of pendingTasks) {
      const key = `nt-notified-${task.id}`;
      if (firedRef.current.has(key)) continue;
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) { firedRef.current.add(key); continue; }
      } catch { /* ignore */ }

      const dl = new Date(task.deadline!).getTime();
      const isOverdue = dl < now;
      const hoursLeft = Math.round((dl - now) / 3_600_000);

      const title = isOverdue ? `⚠️ Просрочено: ${task.title}` : `⏰ Скоро дедлайн: ${task.title}`;
      const body = isOverdue
        ? `Задача просрочена. Приоритет: ${task.priority}`
        : `Осталось ${hoursLeft} ч. Приоритет: ${task.priority}`;

      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: `nt-${task.id}`,
          silent: false,
        });
        sessionStorage.setItem(key, '1');
        firedRef.current.add(key);
      } catch { /* ignore */ }
    }
  }, [tasks]);

  return null;
}

/**
 * Button that requests notification permission from the user.
 * Shown only if permission is not yet granted/denied.
 */
export function NotificationPermissionButton() {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (!('Notification' in window)) return true;
    return Notification.permission !== 'default';
  });

  async function request() {
    const perm = await Notification.requestPermission();
    setHidden(true);
    if (perm === 'granted') {
      new Notification('Focus', {
        body: 'Уведомления включены! Вы будете получать напоминания о дедлайнах.',
        icon: '/icon-192.png',
      });
    }
  }

  if (hidden) return null;

  return (
    <button
      onClick={() => { void request(); }}
      className="btn btn-ghost"
      style={{ gap: 6, fontSize: '0.82rem', padding: '8px 14px' }}
    >
      🔔 Включить уведомления
    </button>
  );
}
