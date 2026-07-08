import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import type { Lecture, LectureStatus } from '../types';
import { supabase } from '../store/supabase';
import { formatDisplayTime } from '../utils/timeUtils';

interface Props {
  lectures: Lecture[];
  onUpdate: (updated: Lecture[]) => void;
}

const STATUS_OPTIONS: { value: LectureStatus; label: string; color: string; bg: string }[] = [
  { value: 'active', label: 'Active', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { value: 'rescheduled', label: 'Rescheduled', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
];

export function TimetableManager({ lectures, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [newStatus, setNewStatus] = useState<LectureStatus>('cancelled');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Group by date
  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = lectures
    .filter(l => l.date >= today)
    .filter(l =>
      !search ||
      l.subject.toLowerCase().includes(search.toLowerCase()) ||
      l.faculty.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date));

  const byDate = new Map<string, Lecture[]>();
  for (const l of upcoming) {
    if (!byDate.has(l.date)) byDate.set(l.date, []);
    byDate.get(l.date)!.push(l);
  }

  const handleSelectLecture = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setNewStatus(lecture.status);
    setReason(lecture.cancellationReason || '');
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedLecture) return;
    setSaving(true);

    const updated = lectures.map(l =>
      l.id === selectedLecture.id
        ? { ...l, status: newStatus, cancellationReason: reason }
        : l
    );

    const { error } = await supabase
      .from('timetable')
      .upsert({
        id: 1,
        lectures: updated,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (!error) {
      onUpdate(updated);
      setSelectedLecture({ ...selectedLecture, status: newStatus, cancellationReason: reason });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  const statusOf = (l: Lecture) =>
    STATUS_OPTIONS.find(s => s.value === l.status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-white text-sm">📋 Manage Timetable</p>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
          Tap any class to mark it cancelled, rescheduled, or add a message.
        </p>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search subject or faculty..."
        className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />

      {/* Edit panel */}
      {selectedLecture && (
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div>
            <p className="font-semibold text-white text-sm">{selectedLecture.subject}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {format(parseISO(selectedLecture.date), 'EEE, d MMM')} · {formatDisplayTime(selectedLecture.startTime)} – {formatDisplayTime(selectedLecture.endTime)}
            </p>
          </div>

          {/* Status buttons */}
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setNewStatus(s.value)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: newStatus === s.value ? s.bg : 'rgba(255,255,255,0.04)',
                  color: newStatus === s.value ? s.color : '#6b7280',
                  border: `1px solid ${newStatus === s.value ? s.color + '40' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Reason input */}
          {newStatus !== 'active' && (
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={newStatus === 'cancelled' ? 'Reason for cancellation...' : 'Rescheduled to...'}
              className="w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          )}

          <div className="flex gap-2">
            <button onClick={() => setSelectedLecture(null)}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: saved ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save & Publish'}
            </button>
          </div>
        </div>
      )}

      {/* Lecture list */}
      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
        {Array.from(byDate.entries()).map(([date, dayLectures]) => (
          <div key={date}>
            <p className="text-xs font-semibold mb-2 px-1"
              style={{ color: date === today ? '#a78bfa' : '#6b7280' }}>
              {date === today ? '⚡ Today' : format(parseISO(date), 'EEEE, d MMM')}
            </p>
            <div className="space-y-1.5">
              {dayLectures.map(l => {
                const s = statusOf(l);
                const isSelected = selectedLecture?.id === l.id;
                return (
                  <button key={l.id} onClick={() => handleSelectLecture(l)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium truncate ${l.status === 'cancelled' ? 'line-through text-gray-500' : 'text-white'}`}>
                          {l.subject}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#6b7280' }}>
                          {formatDisplayTime(l.startTime)} · {l.faculty}
                        </p>
                        {l.cancellationReason && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#f87171' }}>
                            ℹ️ {l.cancellationReason}
                          </p>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-lg shrink-0 font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {byDate.size === 0 && (
          <p className="text-xs text-center py-6" style={{ color: '#6b7280' }}>
            No upcoming lectures found
          </p>
        )}
      </div>
    </div>
  );
}
