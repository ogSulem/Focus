'use client';

import { useState } from 'react';
import type { Task } from '@/lib/api';
import { TaskCard } from './task-card';
import { toast } from './toast';

type Filter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE';
type SortBy = 'createdAt' | 'deadline' | 'priority' | 'title';

const FILTERS: { value: Filter; label: string; emoji: string }[] = [
  { value: 'ALL',         label: 'Все',          emoji: '📋' },
  { value: 'TODO',        label: 'Запланировано', emoji: '🔲' },
  { value: 'IN_PROGRESS', label: 'В процессе',   emoji: '⚡' },
  { value: 'DONE',        label: 'Готово',       emoji: '✅' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'createdAt', label: 'Дата создания' },
  { value: 'priority',  label: 'Приоритет' },
  { value: 'deadline',  label: 'Дедлайн' },
  { value: 'title',     label: 'Название' },
];

const PRIORITY_WEIGHT: Record<Task['priority'], number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function sortTasks(tasks: Task[], sortBy: SortBy, order: 'asc' | 'desc'): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'priority':
        cmp = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        break;
      case 'deadline': {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        cmp = da - db;
        break;
      }
      case 'title':
        cmp = a.title.localeCompare(b.title, 'ru');
        break;
      case 'createdAt':
      default:
        cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
    }
    return order === 'asc' ? cmp : -cmp;
  });
}

interface TaskFilterBarProps {
  tasks: Task[];
  apiUrl?: string;
  token?: string;
}

export function TaskFilterBar({ tasks: initialTasks, apiUrl, token }: TaskFilterBarProps) {
  const [active, setActive] = useState<Filter>('ALL');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all unique tags from all tasks
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags ?? []))).sort();

  const counts: Record<Filter, number> = {
    ALL:         tasks.length,
    TODO:        tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE:        tasks.filter((t) => t.status === 'DONE').length,
  };

  const statusFiltered = active === 'ALL' ? tasks : tasks.filter((t) => t.status === active);
  const tagFiltered = activeTag ? statusFiltered.filter((t) => (t.tags ?? []).includes(activeTag)) : statusFiltered;
  const searchFiltered = searchQuery.trim()
    ? tagFiltered.filter((t) => {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
        );
      })
    : tagFiltered;
  const visible = sortTasks(searchFiltered, sortBy, sortOrder);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === visible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((t) => t.id)));
    }
  }

  function clearSelection() { setSelected(new Set()); }

  function toggleSortOrder() {
    setSortOrder((o) => o === 'asc' ? 'desc' : 'asc');
  }

  async function bulkAction(action: 'complete' | 'delete') {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const ids = [...selected];
    try {
      if (!token || !apiUrl) {
        if (action === 'delete') {
          setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
          toast.info(`Удалено ${ids.length} задач`);
        } else {
          setTasks((prev) => prev.map((t) => ids.includes(t.id) ? { ...t, status: 'DONE' as const } : t));
          toast.success(`Выполнено ${ids.length} задач 🎯`);
        }
        clearSelection();
        return;
      }

      const res = await fetch(`${apiUrl}/tasks/bulk`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'delete'
            ? { ids, delete: true }
            : { ids, status: 'DONE' }
        ),
      });
      if (!res.ok) throw new Error('Bulk action failed');

      if (action === 'delete') {
        setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
        toast.info(`Удалено ${ids.length} задач`);
      } else {
        setTasks((prev) => prev.map((t) => ids.includes(t.id) ? { ...t, status: 'DONE' as const } : t));
        toast.success(`Выполнено ${ids.length} задач 🎯`);
      }
      clearSelection();
    } catch {
      toast.error('Не удалось выполнить массовое действие');
    } finally {
      setBulkLoading(false);
    }
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  function handleDuplicate(newTask: Task) {
    setTasks((prev) => [...prev, newTask]);
  }

  function handleUpdate(updated: Task) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  }

  return (
    <div>
      {/* Inline search */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <svg
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); clearSelection(); }}
          placeholder="Поиск задач по названию, описанию или тегу…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '7px 32px 7px 30px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-1)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', padding: 2, lineHeight: 1,
              fontSize: '0.75rem',
            }}
            aria-label="Очистить поиск"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'var(--border)',
        borderRadius: 12, padding: 3,
        marginBottom: 8,
        overflowX: 'auto',
      }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setActive(f.value); clearSelection(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: active === f.value ? 600 : 400,
              background: active === f.value ? 'var(--bg-elevated)' : 'transparent',
              color: active === f.value ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: active === f.value ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s var(--ease)',
              whiteSpace: 'nowrap',
            }}
          >
            {f.emoji} {f.label}
            {counts[f.value] > 0 && (
              <span style={{
                background: active === f.value ? 'rgba(99,102,241,0.15)' : 'var(--border-strong)',
                color: active === f.value ? 'var(--accent-1)' : 'var(--text-tertiary)',
                borderRadius: 999, padding: '0px 5px',
                fontSize: '0.68rem', fontWeight: 700,
                lineHeight: '16px', minWidth: 16, textAlign: 'center',
              }}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 600,
                background: 'rgba(99,102,241,0.15)', color: 'var(--accent-1)',
                border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer',
              }}
            >
              ✕ Все теги
            </button>
          )}
          {allTags.map((tag) => {
            const h = hashTag(tag);
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? null : tag)}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 8px', borderRadius: 999,
                  fontSize: '0.65rem', fontWeight: 600,
                  background: isActive ? `hsl(${h}, 70%, 15%)` : 'transparent',
                  color: `hsl(${h}, 75%, 70%)`,
                  border: `1px solid hsl(${h}, 65%, ${isActive ? 40 : 25}%)`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  opacity: activeTag && !isActive ? 0.6 : 1,
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Sort + Bulk actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {/* Sort controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            style={{
              padding: '4px 8px', borderRadius: 8,
              border: '1.5px solid var(--border-strong)',
              background: 'var(--bg-base)', color: 'var(--text-secondary)',
              fontSize: '0.72rem', cursor: 'pointer',
              outline: 'none', fontFamily: 'inherit',
            }}
            aria-label="Сортировка"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={toggleSortOrder}
            title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
            style={{
              width: 26, height: 26, borderRadius: 7,
              border: '1.5px solid var(--border-strong)',
              background: 'var(--bg-base)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', transition: 'all 0.15s',
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Export buttons */}
        {apiUrl && token && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {(['csv', 'json'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  fetch(`${apiUrl}/tasks/export?format=${fmt}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }).then(async (r) => {
                    const blob = await r.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.${fmt}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }).catch(() => null);
                }}
                title={`Экспорт в ${fmt.toUpperCase()}`}
                style={{
                  padding: '4px 10px', borderRadius: 8,
                  border: '1.5px solid var(--border-strong)',
                  background: 'var(--bg-base)', color: 'var(--text-secondary)',
                  fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-1)'; e.currentTarget.style.color = 'var(--accent-1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                ↓ {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Bulk select-all */}
        {visible.length > 0 && (
          <>
            <button
              onClick={toggleSelectAll}
              title={selected.size === visible.length ? 'Снять выделение' : 'Выбрать все'}
              style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${selected.size > 0 ? 'var(--accent-1)' : 'var(--border-strong)'}`,
                background: selected.size === visible.length ? 'var(--accent-1)' : selected.size > 0 ? 'rgba(99,102,241,0.15)' : 'transparent',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {selected.size > 0 && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  {selected.size === visible.length
                    ? <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    : <line x1="2" y1="6" x2="10" y2="6" stroke="var(--accent-1)" strokeWidth="2" strokeLinecap="round"/>
                  }
                </svg>
              )}
            </button>

            {selected.size > 0 ? (
              <>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-1)', fontWeight: 600 }}>
                  {selected.size} выбрано
                </span>
                <button
                  onClick={() => { void bulkAction('complete'); }}
                  disabled={bulkLoading}
                  style={{
                    padding: '3px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: 'rgba(16,185,129,0.12)', color: '#059669',
                    fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.12s',
                    opacity: bulkLoading ? 0.5 : 1,
                  }}
                >
                  ✓ Выполнить
                </button>
                <button
                  onClick={() => { void bulkAction('delete'); }}
                  disabled={bulkLoading}
                  style={{
                    padding: '3px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: 'rgba(239,68,68,0.10)', color: '#dc2626',
                    fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.12s',
                    opacity: bulkLoading ? 0.5 : 1,
                  }}
                >
                  🗑 Удалить
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    padding: '3px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: 'var(--text-tertiary)',
                    fontSize: '0.68rem', transition: 'all 0.12s',
                  }}
                >
                  ✕
                </button>
              </>
            ) : (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                {visible.length} задач
              </span>
            )}
          </>
        )}
      </div>

      {/* Task list */}
      {visible.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '28px 0',
          color: 'var(--text-tertiary)', fontSize: '0.85rem', gap: 8,
        }}>
          <span style={{ fontSize: '2rem' }}>{searchQuery ? '🔍' : '🎉'}</span>
          <p>
            {searchQuery
              ? `Ничего не найдено по «${searchQuery}»`
              : active === 'DONE' ? 'Нет выполненных задач' : 'Нет задач в этом фильтре'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                fontSize: '0.75rem', padding: '4px 10px', borderRadius: 8,
                background: 'rgba(99,102,241,0.1)', color: 'var(--accent-1)',
                border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer',
              }}
            >
              Сбросить поиск
            </button>
          )}
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map((task) => (
            <div key={task.id} className="animate-slide-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <button
                onClick={() => toggleSelect(task.id)}
                style={{
                  marginTop: 14, width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${selected.has(task.id) ? 'var(--accent-1)' : 'var(--border-strong)'}`,
                  background: selected.has(task.id) ? 'var(--accent-1)' : 'transparent',
                  cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                aria-label={selected.has(task.id) ? 'Снять выделение' : 'Выбрать задачу'}
              >
                {selected.has(task.id) && (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TaskCard
                  task={task}
                  apiUrl={apiUrl}
                  token={token}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onUpdate={handleUpdate}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Simple hash for deterministic tag colors */
function hashTag(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return (h * 137) % 360;
}
