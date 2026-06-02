'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@/lib/api';
import { ToastProvider, toast } from '@/components/toast';
import { ThemeToggle } from '@/components/theme-toggle';

type Phase = 'focus' | 'short-break' | 'long-break';

interface SessionRecord {
  id: string;
  phase: Phase;
  taskTitle: string | null;
  durationMin: number;
  completedAt: string; // ISO
}

const STORAGE_KEY = 'nt-pomodoro-history';
const MAX_HISTORY = 20;

function loadHistory(): SessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SessionRecord[];
  } catch { return []; }
}

function saveHistory(records: SessionRecord[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_HISTORY))); } catch { /* ignore */ }
}

const DEFAULT_PHASE_SECS: Record<Phase, number> = {
  focus: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

function loadPhaseSecs(): Record<Phase, number> {
  if (typeof window === 'undefined') return { ...DEFAULT_PHASE_SECS };
  const focus = parseInt(localStorage.getItem('nt-focus-duration') ?? '25', 10);
  const short = parseInt(localStorage.getItem('nt-short-break') ?? '5', 10);
  const long  = parseInt(localStorage.getItem('nt-long-break') ?? '15', 10);
  return {
    focus:       (isNaN(focus) ? 25 : focus) * 60,
    'short-break': (isNaN(short) ? 5 : short) * 60,
    'long-break':  (isNaN(long) ? 15 : long) * 60,
  };
}

const PHASE_LABEL: Record<Phase, string> = {
  focus: 'Фокус',
  'short-break': 'Короткий перерыв',
  'long-break': 'Длинный перерыв',
};
const PHASE_COLOR: Record<Phase, string> = {
  focus: '#6366f1',
  'short-break': '#10b981',
  'long-break': '#f59e0b',
};
const PHASE_EMOJI: Record<Phase, string> = {
  focus: '🎯',
  'short-break': '☕',
  'long-break': '🌴',
};

interface FocusModeClientProps {
  tasks: Task[];
  apiUrl: string;
  token: string;
}

export function FocusModeClient({ tasks, apiUrl, token }: FocusModeClientProps) {
  const router = useRouter();
  const [phaseSecs] = useState<Record<Phase, number>>(loadPhaseSecs);
  const [phase, setPhase] = useState<Phase>('focus');
  const [timeLeft, setTimeLeft] = useState(() => loadPhaseSecs().focus);
  const [running, setRunning] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks[0]?.id ?? null);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>(() => loadHistory());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const total = phaseSecs[phase];
  const progress = total > 0 ? Math.min(Math.max((total - timeLeft) / total, 0), 1) : 0;
  const r = 80;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);
  const accentColor = PHASE_COLOR[phase];

  const recordSession = useCallback((p: Phase, taskTitle: string | null, durationMin: number) => {
    const record: SessionRecord = {
      id: Date.now().toString(),
      phase: p,
      taskTitle,
      durationMin,
      completedAt: new Date().toISOString(),
    };
    setSessionHistory((prev) => {
      const next = [record, ...prev].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });

    // Persist to backend (fire-and-forget — UI should not fail if request fails)
    fetch('/api/focus-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: p, taskTitle, durationMin }),
    }).catch(() => { /* silently ignore network errors */ });
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const switchPhase = useCallback((next: Phase) => {
    stopInterval();
    setRunning(false);
    setPhase(next);
    setTimeLeft(phaseSecs[next]);
  }, [stopInterval, phaseSecs]);

  // Timer tick
  useEffect(() => {
    if (!running) { stopInterval(); return stopInterval; }

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t > 1) return t - 1;

        if (phase === 'focus') {
          const newDone = sessionsDone + 1;
          setSessionsDone(newDone);
          setTotalPomodoros((p) => p + 1);
          setCompleted(true);
          setTimeout(() => setCompleted(false), 2500);
          recordSession('focus', selectedTask?.title ?? null, Math.round(phaseSecs.focus / 60));

          if (newDone >= 4) {
            setSessionsDone(0);
            toast.success('🌴 Длинный перерыв!', '4 pomodoro завершено — вы заслужили отдых!');
            switchPhase('long-break');
            return phaseSecs['long-break'];
          } else {
            toast.info('☕ Короткий перерыв', `Сессия ${newDone}/4 завершена`);
            switchPhase('short-break');
            return phaseSecs['short-break'];
          }
        } else {
          recordSession(phase, null, Math.round(phaseSecs[phase] / 60));
          toast.success('🎯 Время фокуса!', 'Перерыв закончился.');
          switchPhase('focus');
          return phaseSecs['focus'];
        }
      });
    }, 1000);

    return stopInterval;
  }, [running, phase, stopInterval, switchPhase, recordSession, phaseSecs, selectedTask?.title, sessionsDone]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ') { e.preventDefault(); setRunning((r) => !r); }
      if (e.key === 'r' || e.key === 'R') { stopInterval(); setRunning(false); setTimeLeft(phaseSecs[phase]); }
      if (e.key === 'Escape') router.push('/dashboard');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, stopInterval, router, phaseSecs]);

  // Close picker on outside click
  useEffect(() => {
    if (!taskPickerOpen) return;
    function onOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setTaskPickerOpen(false);
    }
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, [taskPickerOpen]);

  // Mark task done
  async function markDone() {
    if (!selectedTaskId) return;
    try {
      await fetch(`${apiUrl}/tasks/${selectedTaskId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      toast.success('✅ Задача выполнена!', selectedTask?.title ?? '');
      const next = tasks.find((t) => t.id !== selectedTaskId && t.status !== 'DONE');
      setSelectedTaskId(next?.id ?? null);
    } catch {
      toast.error('Не удалось обновить задачу');
    }
  }

  function applyCustomTime() {
    const m = parseInt(customMin, 10);
    if (!m || m < 1 || m > 120) return;
    stopInterval();
    setRunning(false);
    setTimeLeft(m * 60);
    setShowCustom(false);
    setCustomMin('');
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ToastProvider />

      {/* Ambient background */}
      <div className="ambient-bg" aria-hidden="true">
        <div style={{
          position: 'absolute',
          width: 600, height: 600,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`,
          transition: 'background 1s ease',
          animation: 'ambient-drift-3 20s ease-in-out infinite',
        }} />
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
      </div>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        zIndex: 10,
        background: 'linear-gradient(to bottom, var(--bg-base) 0%, transparent 100%)',
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn btn-ghost"
          style={{ gap: 6, fontSize: '0.8rem', padding: '7px 14px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Выйти
          <kbd style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: 'var(--border)', borderRadius: 4, padding: '1px 5px' }}>Esc</kbd>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Focus</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Focus Mode</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Phase tabs */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'var(--border)',
        borderRadius: 12, padding: 4,
        marginBottom: 16,
        position: 'relative', zIndex: 2,
      }}>
        {(['focus', 'short-break', 'long-break'] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            style={{
              padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
              background: phase === p ? 'var(--bg-elevated)' : 'transparent',
              color: phase === p ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: phase === p ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s var(--ease)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {PHASE_EMOJI[p]} {PHASE_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Phase badge pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 14px', borderRadius: 999,
        marginBottom: 24, zIndex: 2,
        background: phase === 'focus'
          ? 'rgba(99,102,241,0.15)'
          : phase === 'short-break'
            ? 'rgba(16,185,129,0.15)'
            : 'rgba(245,158,11,0.15)',
        border: `1.5px solid ${accentColor}44`,
        fontSize: '0.8rem', fontWeight: 700,
        color: accentColor,
        transition: 'all 0.4s ease',
      }}>
        <span>{phase === 'focus' ? '🧠' : '☕'}</span>
        <span>{phase === 'focus' ? 'Фокус-режим' : phase === 'short-break' ? 'Короткий перерыв' : 'Длинный перерыв'}</span>
        {running && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: accentColor,
            animation: 'pulse-ring 1.5s ease-out infinite',
            boxShadow: `0 0 0 0 ${accentColor}`,
          }} />
        )}
      </div>

      {/* Ring timer */}
      <div style={{
        position: 'relative',
        width: 220, height: 220,
        marginBottom: 32,
        zIndex: 2,
      }}>
        <svg width="220" height="220" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}
          className={running && phase === 'focus' ? 'breathing-ring' : undefined}>
          {/* Track */}
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="100" cy="100" r={r}
            fill="none"
            stroke={accentColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: running ? 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' : 'stroke 0.5s ease',
              filter: running ? `drop-shadow(0 0 12px ${accentColor}88)` : 'none',
            }}
          />
        </svg>

        {/* Pulsing ring when running */}
        {running && (
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            animation: 'pulse-ring 2.5s ease-out infinite',
            boxShadow: `0 0 0 0 ${accentColor}40`,
          }} />
        )}

        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 4,
        }}>
          <span
            className={running ? 'animate-float' : undefined}
            style={{ fontSize: '1.6rem', lineHeight: 1, marginBottom: 2, transition: 'opacity 0.4s' }}
          >
            {PHASE_EMOJI[phase]}
          </span>
          <span style={{
            fontSize: '2.6rem',
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            color: running ? 'var(--text-primary)' : 'var(--text-secondary)',
            lineHeight: 1,
            transition: 'color 0.4s',
            fontFamily: '-apple-system, BlinkMacSystemFont, monospace',
          }}>
            {mm}:{ss}
          </span>
          <span style={{
            fontSize: '0.72rem',
            color: accentColor,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'color 0.5s ease',
          }}>
            {PHASE_LABEL[phase]}
          </span>
        </div>

        {/* Burst animation on session complete */}
        {completed && (
          <div style={{
            position: 'absolute', inset: -20,
            borderRadius: '50%',
            border: `3px solid ${accentColor}`,
            animation: 'ping 0.8s ease-out 3',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 28, zIndex: 2 }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: running ? 'var(--bg-card)' : 'var(--accent-gradient)',
            border: running ? '2px solid var(--border-strong)' : 'none',
            color: running ? 'var(--text-primary)' : '#fff',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: running ? 'var(--shadow-md)' : `0 4px 20px ${accentColor}55`,
            transition: 'all 0.2s var(--ease)',
            transform: running ? 'scale(1)' : 'scale(1.05)',
          }}
          aria-label={running ? 'Pause' : 'Start'}
        >
          {running ? '⏸' : '▶'}
        </button>

        <button
          onClick={() => { stopInterval(); setRunning(false); setTimeLeft(phaseSecs[phase]); }}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            fontSize: '1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
          title="Сбросить (R)"
        >
          ↺
        </button>

        <button
          onClick={() => setShowCustom((v) => !v)}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
          title="Своё время"
        >
          ⏱
        </button>
      </div>

      {/* Custom time input */}
      {showCustom && (
        <div className="card animate-scale-in" style={{
          padding: '14px 18px', marginBottom: 20, zIndex: 2,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Минут:</span>
          <input
            type="number"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            min={1} max={120}
            placeholder="25"
            style={{
              width: 60, padding: '6px 10px',
              borderRadius: 8, border: '1.5px solid var(--border-strong)',
              background: 'var(--bg-base)', color: 'var(--text-primary)',
              fontSize: '0.9rem', fontFamily: 'monospace',
              outline: 'none', textAlign: 'center',
            }}
            onKeyDown={(e) => e.key === 'Enter' && applyCustomTime()}
            autoFocus
          />
          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={applyCustomTime}>
            Ок
          </button>
        </div>
      )}

      {/* Session stars */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 36, zIndex: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: i < sessionsDone ? '1.1rem' : '0.9rem',
              transition: 'all 0.3s var(--ease-spring)',
              filter: i < sessionsDone ? `drop-shadow(0 0 6px ${accentColor}99)` : 'none',
              opacity: i < sessionsDone ? 1 : 0.3,
            }}
          >
            ⭐
          </span>
        ))}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
          {sessionsDone}/4 сессий · {totalPomodoros} pomodoro всего
        </span>
      </div>

      {/* Task selector */}
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 2 }} ref={pickerRef}>
        <div
          onClick={() => setTaskPickerOpen((v) => !v)}
          style={{
            padding: '14px 18px',
            borderRadius: 16,
            border: '1.5px solid var(--border-strong)',
            background: 'var(--bg-card)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            backdropFilter: 'blur(12px)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: taskPickerOpen ? `0 0 0 3px ${accentColor}22, var(--shadow-md)` : 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = accentColor + '66'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)'; }}
        >
          <span style={{ fontSize: '1.2rem' }}>🎯</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>Фокусируюсь на</p>
            <p style={{
              fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {selectedTask?.title ?? 'Выберите задачу…'}
            </p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: taskPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-tertiary)', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {taskPickerOpen && (
          <div className="card animate-scale-in" style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            maxHeight: 280, overflowY: 'auto',
            padding: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 20,
          }}>
            {tasks.length === 0 ? (
              <p style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Все задачи выполнены 🎉
              </p>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTaskId(t.id); setTaskPickerOpen(false); }}
                  style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: t.id === selectedTaskId ? `${accentColor}12` : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (t.id !== selectedTaskId) (e.currentTarget as HTMLDivElement).style.background = 'var(--border)'; }}
                  onMouseLeave={(e) => { if (t.id !== selectedTaskId) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: t.priority === 'HIGH' ? '#ef4444' : t.priority === 'MEDIUM' ? '#f59e0b' : '#10b981',
                  }} />
                  <span style={{
                    fontSize: '0.85rem', fontWeight: t.id === selectedTaskId ? 600 : 400,
                    color: t.id === selectedTaskId ? accentColor : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {t.title}
                  </span>
                  {t.id === selectedTaskId && <span style={{ fontSize: '0.8rem', color: accentColor }}>✓</span>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Task actions */}
      {selectedTask && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, zIndex: 2 }}>
          <button
            onClick={() => { void markDone(); }}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            ✅ Отметить выполненной
          </button>
        </div>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <div style={{
          marginTop: 24, width: '100%', maxWidth: 460,
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1px solid var(--border)', padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>История сессий</h3>
            <button
              onClick={() => { setSessionHistory([]); saveHistory([]); }}
              style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget).style.color = 'var(--accent-1)'; }}
              onMouseLeave={(e) => { (e.currentTarget).style.color = 'var(--text-tertiary)'; }}
            >
              Очистить
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {sessionHistory.map((s) => {
              const timeAgo = (() => {
                const diff = Math.floor((Date.now() - new Date(s.completedAt).getTime()) / 60000);
                if (diff < 1) return 'только что';
                if (diff < 60) return `${diff} мин назад`;
                const h = Math.floor(diff / 60);
                return `${h}ч назад`;
              })();
              const phaseEmoji = { focus: '🎯', 'short-break': '☕', 'long-break': '🌴' }[s.phase];
              const phaseLabel = { focus: 'Фокус', 'short-break': 'Короткий перерыв', 'long-break': 'Длинный перерыв' }[s.phase];
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 10,
                  background: 'var(--bg-base)', fontSize: '0.78rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>{phaseEmoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {phaseLabel} · {s.durationMin} мин
                    </div>
                    {s.taskTitle && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.taskTitle}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{timeAgo}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div style={{
        position: 'fixed', bottom: 20,
        display: 'flex', gap: 16, alignItems: 'center',
        fontSize: '0.68rem', color: 'var(--text-tertiary)',
        zIndex: 2,
      }}>
        {[
          { key: 'Space', action: 'старт/пауза' },
          { key: 'R', action: 'сброс' },
          { key: 'Esc', action: 'выйти' },
        ].map(({ key, action }) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{ fontFamily: 'monospace', background: 'var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem' }}>{key}</kbd>
            {action}
          </span>
        ))}
      </div>
    </div>
  );
}
