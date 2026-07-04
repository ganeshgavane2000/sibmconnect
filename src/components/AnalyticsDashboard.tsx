import { useEffect, useState } from 'react';
import { fetchStudentActivity } from '../store/supabase';
import { format, formatDistanceToNow } from 'date-fns';

interface StudentActivityRow {
  roll_number: string;
  name: string;
  specialization: string;
  minor: string;
  last_seen: string;
  first_seen: string;
}

export function AnalyticsDashboard() {
  const [students, setStudents] = useState<StudentActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStudentActivity().then(data => {
      setStudents(data as StudentActivityRow[]);
      setLoading(false);
    });
  }, []);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchStudentActivity();
    setStudents(data as StudentActivityRow[]);
    setLoading(false);
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalStudents = students.length;
  const activeToday = students.filter(s => {
    const lastSeen = new Date(s.last_seen);
    const today = new Date();
    return lastSeen.toDateString() === today.toDateString();
  }).length;

  const specCounts: Record<string, number> = {};
  students.forEach(s => {
    specCounts[s.specialization] = (specCounts[s.specialization] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white text-sm">📊 Student Analytics</p>
        <button onClick={refresh} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-2xl font-black text-white">{totalStudents}</p>
          <p className="text-xs mt-0.5" style={{ color: '#a78bfa' }}>Total students</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <p className="text-2xl font-black text-white">{activeToday}</p>
          <p className="text-xs mt-0.5" style={{ color: '#34d399' }}>Active today</p>
        </div>
      </div>

      {/* Specialization breakdown */}
      {Object.keys(specCounts).length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>By Specialization</p>
          <div className="space-y-1.5">
            {Object.entries(specCounts).sort((a, b) => b[1] - a[1]).map(([spec, count]) => (
              <div key={spec} className="flex items-center gap-2">
                <span className="text-xs w-24 truncate" style={{ color: '#9ca3af' }}>{spec}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${(count / totalStudents) * 100}%`,
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                  }} />
                </div>
                <span className="text-xs font-semibold text-white w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or roll number..."
        className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      />

      {/* Student list */}
      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
        {filtered.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: '#6b7280' }}>No students found</p>
        ) : (
          filtered.map(s => (
            <div key={s.roll_number} className="glass rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {s.roll_number} · {s.specialization}
                    {s.minor !== 'None' && ` · ${s.minor} minor`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  {formatDistanceToNow(new Date(s.last_seen), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {students.length > 0 && (
        <p className="text-xs text-center" style={{ color: '#4b5563' }}>
          First student joined {format(new Date(students[students.length - 1]?.first_seen || Date.now()), 'dd MMM yyyy')}
        </p>
      )}
    </div>
  );
}
