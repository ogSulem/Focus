'use client';

import { useMemo, useState } from 'react';
import type { Task } from '@/lib/api';

interface TaskDeadlineCalendarProps {
  tasks: Task[];
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TaskDeadlineCalendar({ tasks }: TaskDeadlineCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);

  const today = new Date();
  const baseYear = today.getFullYear();
  const baseMonth = today.getMonth();
  const monthDate = useMemo(
    () => new Date(baseYear, baseMonth + monthOffset, 1),
    [baseYear, baseMonth, monthOffset],
  );
  const monthTitle = monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const deadlineMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.deadline || task.status === 'DONE') continue;
      const key = task.deadline.slice(0, 10);
      const bucket = map.get(key) ?? [];
      bucket.push(task);
      map.set(key, bucket);
    }
    return map;
  }, [tasks]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

    // JS week starts from Sunday=0; convert to Monday-first index 0..6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNum = index - startOffset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayNum);
      const dateKey = toDateKey(date);
      const dayTasks = deadlineMap.get(dateKey) ?? [];
      return { dayNum, dateKey, tasks: dayTasks };
    });
  }, [deadlineMap, monthDate]);

  const monthPending = useMemo(() => {
    return calendarCells.reduce((acc, cell) => acc + (cell ? cell.tasks.length : 0), 0);
  }, [calendarCells]);

  return (
    <section className="card glow-card animate-slide-up" style={{ padding: '22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>📅 Календарь дедлайнов</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Визуальная нагрузка по срокам · открытых задач в месяце: {monthPending}
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '6px 10px' }} onClick={() => setMonthOffset((v) => v - 1)}>
            ←
          </button>
          <span className="badge badge-progress" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{monthTitle}</span>
          <button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '6px 10px' }} onClick={() => setMonthOffset((v) => v + 1)}>
            →
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 8 }}>
        {WEEK_DAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  border: '1px dashed var(--border)',
                  background: 'color-mix(in oklab, var(--bg-base) 70%, transparent)',
                }}
              />
            );
          }

          const count = cell.tasks.length;
          const intensity =
            count >= 4 ? 'rgba(239,68,68,0.22)'
            : count === 3 ? 'rgba(245,158,11,0.22)'
            : count >= 1 ? 'rgba(99,102,241,0.20)'
            : 'var(--bg-base)';

          return (
            <div
              key={cell.dateKey}
              title={count > 0 ? cell.tasks.map((t) => t.title).slice(0, 4).join(' • ') : 'Нет дедлайнов'}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: intensity,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cell.dayNum}</span>
              {count > 0 && (
                <span
                  style={{
                    alignSelf: 'flex-end',
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 999,
                    background: count >= 4 ? '#ef4444' : count === 3 ? '#f59e0b' : '#6366f1',
                    color: 'white',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
