'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  target: number;
  current: number;
  unit: string;
  deadline?: string | null;
  completed: boolean;
  completedAt?: string | null;
  color: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'personal', label: '🏠 Личное', color: '#6366f1' },
  { value: 'work', label: '💼 Работа', color: '#3b82f6' },
  { value: 'health', label: '💪 Здоровье', color: '#10b981' },
  { value: 'finance', label: '💰 Финансы', color: '#f59e0b' },
  { value: 'learning', label: '📚 Учёба', color: '#8b5cf6' },
  { value: 'sport', label: '🏃 Спорт', color: '#ef4444' },
  { value: 'creative', label: '🎨 Творчество', color: '#ec4899' },
  { value: 'social', label: '👥 Социальное', color: '#64748b' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

function getCategoryInfo(cat: string) {
  return CATEGORY_MAP[cat] ?? { value: cat, label: `📌 ${cat}`, color: '#6366f1' };
}

function formatDeadline(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return '⚠️ Просрочено';
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return '⏰ Сегодня';
  if (days === 1) return '⏰ Завтра';
  if (days <= 7) return `📅 ${days} дней`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/* ── Progress ring component ──────────────────────────────── */
function ProgressRing({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct / 100, 1));
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

/* ── New Goal Modal ───────────────────────────────────────── */
interface NewGoalModalProps {
  onClose: () => void;
  onCreated: (g: Goal) => void;
  token: string;
}
function NewGoalModal({ onClose, onCreated, token }: NewGoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [target, setTarget] = useState('100');
  const [current, setCurrent] = useState('0');
  const [unit, setUnit] = useState('%');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCat = getCategoryInfo(category);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        target: parseFloat(target) || 100,
        current: parseFloat(current) || 0,
        unit: unit.trim() || '%',
        deadline: deadline || undefined,
        color: selectedCat.color,
      }),
    }).catch(() => null);
    if (res?.ok) {
      const goal = (await res.json()) as Goal;
      onCreated(goal);
      toast.success('Цель создана! 🎯');
      onClose();
    } else {
      toast.error('Ошибка создания цели');
    }
    setSaving(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 520, padding: 28 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-primary)' }}>
          🎯 Новая цель
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              autoFocus
              placeholder="Название цели *"
              value={title} onChange={(e) => setTitle(e.target.value)}
              style={inputStyle} required
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} style={{ ...inputStyle, resize: 'vertical' }}
            />
            {/* Category */}
            <div>
              <label style={labelStyle}>Категория</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button"
                    onClick={() => setCategory(c.value)}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: '0.78rem',
                      border: `1.5px solid ${category === c.value ? c.color : 'var(--border-strong)'}`,
                      background: category === c.value ? `${c.color}18` : 'transparent',
                      color: category === c.value ? c.color : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: category === c.value ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                  >{c.label}</button>
                ))}
              </div>
            </div>
            {/* Progress fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Цель</label>
                <input type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Текущее</label>
                <input type="number" min="0" value={current} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Единица</label>
                <input type="text" placeholder="%, км, кг..." value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Дедлайн</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Отмена</button>
            <button type="submit" disabled={saving || !title.trim()} className="btn btn-primary">
              {saving ? 'Создание...' : '✓ Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Progress Modal ──────────────────────────────────── */
function EditProgressModal({ goal, onClose, onUpdated, token }: {
  goal: Goal; onClose: () => void; onUpdated: (g: Goal) => void; token: string;
}) {
  const [current, setCurrent] = useState(String(goal.current));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const newCurrent = parseFloat(current) || 0;
    const completed = newCurrent >= goal.target;
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current: newCurrent, completed }),
    }).catch(() => null);
    if (res?.ok) {
      const updated = (await res.json()) as Goal;
      onUpdated(updated);
      if (completed && !goal.completed) toast.success('🎉 Цель достигнута!');
      onClose();
    }
    setSaving(false);
  }

  const pct = Math.min((parseFloat(current) / goal.target) * 100, 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 380, padding: 28 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 6 }}>
          Обновить прогресс
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          {goal.title}
        </p>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ProgressRing pct={pct} color={goal.color} size={100} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {Math.round(pct)}%
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            Текущее значение ({goal.unit})
          </label>
          <input
            autoFocus
            type="number" min="0" max={goal.target * 2}
            value={current} onChange={(e) => setCurrent(e.target.value)}
            style={{ ...inputStyle, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
            из {goal.target} {goal.unit}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-ghost">Отмена</button>
          <button onClick={() => void handleSave()} disabled={saving} className="btn btn-primary">
            {saving ? 'Сохранение...' : '✓ Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Goals Client ────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid var(--border-strong)',
  background: 'var(--bg-base)', color: 'var(--text-primary)',
  fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700,
  color: 'var(--text-secondary)', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 4,
};

interface GoalsClientProps { token: string }

export function GoalsClient({ token }: GoalsClientProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fetchGoals = useCallback(async () => {
    const res = await fetch('/api/goals', {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res?.ok) setGoals((await res.json()) as Goal[]);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await fetchGoals();
      if (!cancelled) {
        setTimeout(() => setLoading(false), 0);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [fetchGoals]);

  async function deleteGoal(id: string) {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res?.ok) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success('Цель удалена');
    }
  }

  const displayed = goals.filter((g) => {
    if (filter === 'active') return !g.completed;
    if (filter === 'completed') return g.completed;
    return true;
  });

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed).length;
  const overallPct = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div>
      {/* Page header */}
      <header className="animate-fade-in" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>🎯</div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Мои цели
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
                {completedGoals} из {totalGoals} достигнуто
              </p>
            </div>
          </div>
          <button onClick={() => setShowNew(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ＋ Новая цель
          </button>
        </div>

        {/* Overall progress bar */}
        {totalGoals > 0 && (
          <div className="card animate-slide-up" style={{ marginTop: 20, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Общий прогресс
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{overallPct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'var(--accent-gradient)',
                width: `${overallPct}%`,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                border: `1.5px solid ${filter === f ? 'var(--accent-1)' : 'var(--border-strong)'}`,
                background: filter === f ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: filter === f ? 'var(--accent-1)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {{ all: 'Все', active: '🎯 Активные', completed: '✅ Достигнуто' }[f]}
            </button>
          ))}
        </div>
      </header>

      {/* Goals grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
          Загрузка...
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎯</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
            {filter === 'completed' ? 'Нет достигнутых целей' : 'Нет активных целей'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 24 }}>
            {filter === 'all' ? 'Поставьте первую цель и начните двигаться к ней!' : ''}
          </p>
          {filter === 'all' && (
            <button onClick={() => setShowNew(true)} className="btn btn-primary">
              ＋ Создать цель
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {displayed.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={setEditGoal}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}

      {showNew && (
        <NewGoalModal
          token={token}
          onClose={() => setShowNew(false)}
          onCreated={(g) => setGoals((prev) => [g, ...prev])}
        />
      )}
      {editGoal && (
        <EditProgressModal
          goal={editGoal}
          token={token}
          onClose={() => setEditGoal(null)}
          onUpdated={(g) => {
            setGoals((prev) => prev.map((x) => (x.id === g.id ? g : x)));
            setEditGoal(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Goal Card ────────────────────────────────────────────── */
function GoalCard({ goal, onEdit, onDelete }: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const catInfo = getCategoryInfo(goal.category);

  return (
    <div className="card animate-fade-in" style={{
      padding: '20px',
      borderTop: `3px solid ${goal.color}`,
      opacity: goal.completed ? 0.8 : 1,
      position: 'relative',
    }}>
      {goal.completed && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(16,185,129,0.12)', color: '#10b981',
          borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
        }}>✅ Достигнуто</div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <ProgressRing pct={pct} color={goal.color} size={64} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {Math.round(pct)}%
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)',
            marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{goal.title}</h3>
          {goal.description && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{goal.description}</p>
          )}
          <span style={{
            display: 'inline-block', marginTop: 4,
            padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
            background: `${catInfo.color}18`, color: catInfo.color,
          }}>{catInfo.label}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Прогресс</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {goal.current} / {goal.target} {goal.unit}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, background: goal.color,
            width: `${pct}%`,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* Deadline */}
      {goal.deadline && (
        <div style={{
          fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 12,
        }}>
          {formatDeadline(goal.deadline)}
        </div>
      )}

      {/* Actions */}
      {!goal.completed && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onEdit(goal)}
            className="btn btn-primary"
            style={{ flex: 1, fontSize: '0.78rem', padding: '7px 12px' }}
          >
            📈 Обновить
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            style={{
              padding: '7px 12px', borderRadius: 10, fontSize: '0.78rem',
              border: '1.5px solid rgba(239,68,68,0.3)',
              background: 'transparent', color: '#ef4444', cursor: 'pointer',
            }}
          >🗑</button>
        </div>
      )}
    </div>
  );
}
