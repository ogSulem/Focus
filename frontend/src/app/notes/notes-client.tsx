'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/components/toast';

interface Note {
  id: string;
  title: string;
  content: string;
  mood?: string | null;
  color: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const MOODS = [
  { emoji: '😊', label: 'Отлично' },
  { emoji: '😐', label: 'Нормально' },
  { emoji: '😔', label: 'Грустно' },
  { emoji: '🔥', label: 'В потоке' },
  { emoji: '😴', label: 'Устал' },
  { emoji: '💡', label: 'Идея' },
  { emoji: '😤', label: 'Напряжённо' },
  { emoji: '🎉', label: 'Радость' },
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#64748b',
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'только что';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

interface NotesClientProps { token: string }

export function NotesClient({ token }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotes = useCallback(async (q = '') => {
    const url = q ? `/api/notes?search=${encodeURIComponent(q)}` : '/api/notes';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res?.ok) {
      const data = (await res.json()) as Note[];
      setNotes(data);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await fetchNotes();
      if (!cancelled) {
        setTimeout(() => setLoading(false), 0);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [fetchNotes]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => void fetchNotes(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchNotes]);

  async function createNote() {
    setCreating(true);
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Новая заметка', content: '' }),
    }).catch(() => null);
    if (res?.ok) {
      const note = (await res.json()) as Note;
      setNotes((prev) => [note, ...prev]);
      setActiveNote(note);
      setTimeout(() => contentRef.current?.focus(), 100);
    }
    setCreating(false);
  }

  function openNote(note: Note) {
    setActiveNote(note);
    setShowColorPicker(false);
    setShowMoodPicker(false);
  }

  const saveActiveNote = useCallback(async (patch: Partial<Note>) => {
    if (!activeNote) return;
    setSaving(true);
    const updated = { ...activeNote, ...patch };
    setActiveNote(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));

    const res = await fetch(`/api/notes/${activeNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    }).catch(() => null);

    if (res?.ok) {
      const saved = (await res.json()) as Note;
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
      setActiveNote(saved);
    }
    setSaving(false);
  }, [activeNote, token]);

  function handleContentChange(val: string) {
    if (!activeNote) return;
    setActiveNote((n) => n ? { ...n, content: val } : n);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveActiveNote({ content: val });
    }, 800);
  }

  function handleTitleChange(val: string) {
    if (!activeNote) return;
    setActiveNote((n) => n ? { ...n, title: val } : n);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveActiveNote({ title: val });
    }, 800);
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res?.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNote?.id === id) setActiveNote(null);
      toast.success('Заметка удалена');
    }
  }

  async function togglePin(note: Note) {
    await saveActiveNote({ pinned: !note.pinned });
    if (activeNote?.id === note.id) {
      await fetchNotes(search);
    } else {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pinned: !note.pinned }),
      }).catch(() => null);
      if (res?.ok) {
        setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, pinned: !n.pinned } : n));
      }
    }
  }

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Sidebar list */}
      <aside style={{
        width: 300, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>📝</span>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Заметки</h2>
              <span style={{
                background: 'var(--accent-gradient)', color: '#fff',
                borderRadius: 20, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700,
              }}>{notes.length}</span>
            </div>
            <button
              onClick={() => void createNote()}
              disabled={creating}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'var(--accent-gradient)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                transition: 'transform 0.15s',
              }}
              title="Новая заметка"
            >+</button>
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              borderRadius: 10, border: '1.5px solid var(--border-strong)',
              background: 'var(--bg-base)', color: 'var(--text-primary)',
              fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              Загрузка...
            </div>
          ) : notes.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📝</div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                {search ? 'Ничего не найдено' : 'Нет заметок. Создайте первую!'}
              </p>
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <>
                  <div style={{ padding: '4px 16px 2px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    📌 Закреплённые
                  </div>
                  {pinned.map((note) => <NoteListItem key={note.id} note={note} active={activeNote?.id === note.id} onOpen={openNote} onPin={togglePin} onDelete={deleteNote} />)}
                  <div style={{ height: 1, background: 'var(--border)', margin: '6px 16px' }} />
                </>
              )}
              {unpinned.map((note) => <NoteListItem key={note.id} note={note} active={activeNote?.id === note.id} onOpen={openNote} onPin={togglePin} onDelete={deleteNote} />)}
            </>
          )}
        </div>
      </aside>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
            }}>
              {/* Color dot + picker */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowColorPicker(!showColorPicker); setShowMoodPicker(false); }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: activeNote.color, border: '3px solid var(--bg-card)',
                    boxShadow: `0 0 0 2px ${activeNote.color}40, 0 2px 6px rgba(0,0,0,0.2)`,
                    cursor: 'pointer', outline: 'none',
                  }}
                />
                {showColorPicker && (
                  <div style={{
                    position: 'absolute', top: 36, left: 0, zIndex: 100,
                    background: 'var(--bg-elevated)', borderRadius: 12,
                    padding: 10, boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border)',
                    display: 'flex', gap: 6, flexWrap: 'wrap', width: 148,
                  }}>
                    {COLORS.map((c) => (
                      <button key={c}
                        onClick={() => { void saveActiveNote({ color: c }); setShowColorPicker(false); }}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c,
                          border: activeNote.color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                          cursor: 'pointer', outline: 'none',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Mood picker */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowMoodPicker(!showMoodPicker); setShowColorPicker(false); }}
                  style={{
                    padding: '4px 10px', borderRadius: 8,
                    border: '1.5px solid var(--border-strong)',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: '0.8rem', color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {activeNote.mood ?? '😶'} <span style={{ fontSize: '0.72rem' }}>Настроение</span>
                </button>
                {showMoodPicker && (
                  <div style={{
                    position: 'absolute', top: 36, left: 0, zIndex: 100,
                    background: 'var(--bg-elevated)', borderRadius: 12,
                    padding: 10, boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border)',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: 200,
                  }}>
                    {MOODS.map((m) => (
                      <button key={m.emoji}
                        onClick={() => { void saveActiveNote({ mood: m.emoji }); setShowMoodPicker(false); }}
                        style={{
                          padding: '6px 8px', borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: activeNote.mood === m.emoji ? 'var(--bg-base)' : 'transparent',
                          cursor: 'pointer', fontSize: '0.8rem',
                          color: 'var(--text-primary)', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span>{m.emoji}</span><span style={{ fontSize: '0.72rem' }}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pin */}
              <button
                onClick={() => void saveActiveNote({ pinned: !activeNote.pinned })}
                title={activeNote.pinned ? 'Открепить' : 'Закрепить'}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem',
                  border: '1.5px solid var(--border-strong)',
                  background: activeNote.pinned ? 'var(--accent-gradient)' : 'transparent',
                  color: activeNote.pinned ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >📌 {activeNote.pinned ? 'Закреплено' : 'Закрепить'}</button>

              <div style={{ flex: 1 }} />

              {/* Save indicator */}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                {saving ? '💾 Сохранение...' : `✓ ${formatDate(activeNote.updatedAt)}`}
              </span>

              {/* Delete */}
              <button
                onClick={() => void deleteNote(activeNote.id)}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem',
                  border: '1.5px solid rgba(239,68,68,0.3)',
                  background: 'transparent', color: '#ef4444', cursor: 'pointer',
                }}
              >🗑 Удалить</button>
            </div>

            {/* Editor body */}
            <div style={{
              flex: 1, padding: '24px 32px', overflowY: 'auto',
              background: 'var(--bg-base)',
            }}>
              {/* Title */}
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Заголовок..."
                style={{
                  width: '100%', fontSize: '1.6rem', fontWeight: 800,
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontFamily: 'inherit',
                  borderBottom: `3px solid ${activeNote.color}`,
                  paddingBottom: 8, marginBottom: 20,
                }}
              />

              {/* Content */}
              <textarea
                ref={contentRef}
                value={activeNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Начните писать... Используйте пространство для мыслей, идей, заметок."
                style={{
                  width: '100%', minHeight: 400,
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontFamily: 'inherit',
                  fontSize: '0.95rem', lineHeight: 1.8, resize: 'none',
                }}
              />
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)', background: 'var(--bg-base)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>📝</div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Выберите заметку
            </p>
            <p style={{ fontSize: '0.82rem', marginBottom: 24 }}>
              или создайте новую
            </p>
            <button
              onClick={() => void createNote()}
              disabled={creating}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              ✏️ Новая заметка
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Note List Item ─────────────────────────────────────────── */
function NoteListItem({
  note, active, onOpen, onPin, onDelete,
}: {
  note: Note;
  active: boolean;
  onOpen: (n: Note) => void;
  onPin: (n: Note) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onOpen(note)}
      style={{
        margin: '2px 8px', padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
        background: active ? `${note.color}18` : 'transparent',
        border: active ? `1.5px solid ${note.color}40` : '1.5px solid transparent',
        transition: 'all 0.15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-base)';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {/* Color accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 8, bottom: 8,
        width: 3, borderRadius: 2, background: note.color,
      }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          {note.mood && <span style={{ fontSize: '0.8rem' }}>{note.mood}</span>}
          <span style={{
            flex: 1, fontSize: '0.85rem', fontWeight: 600,
            color: 'var(--text-primary)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {note.title || 'Без названия'}
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onPin(note); }}
              title={note.pinned ? 'Открепить' : 'Закрепить'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', opacity: note.pinned ? 1 : 0.3,
                padding: 2,
              }}
            >📌</button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', opacity: 0.4, padding: 2,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
            >🗑</button>
          </div>
        </div>
        <p style={{
          fontSize: '0.75rem', color: 'var(--text-tertiary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {note.content || 'Пусто...'}
        </p>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}
