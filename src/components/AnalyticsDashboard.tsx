import { useEffect, useState } from 'react';
import { fetchStudentActivity, fetchTabActivity } from '../store/supabase';
import { format, formatDistanceToNow } from 'date-fns';

interface StudentRow {
  roll_number: string;
  name: string;
  specialization: string;
  minor: string;
  last_seen: string;
  first_seen: string;
}

interface TabRow {
  id: number;
  roll_number: string;
  name: string;
  tab: string;
  accessed_at: string;
}

const TAB_LABELS: Record<string, string> = {
  dashboard: '⚡ Home',
  today: '📅 Today',
  week: '🗓️ Week',
  exams: '📝 Exams',
  mess: '🍽️ Mess',
  bus: '🚌 Bus',
};

export function AnalyticsDashboard() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [tabData, setTabData] = useState<TabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'students' | 'tabs'>('tabs');

  const load = async () => {
    setLoading(true);
    const [s, t] = await Promise.all([fetchStudentActivity(), fetchTabActivity()]);
    setStudents(s as StudentRow[]);
    setTabData(t as TabRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Tab counts
  const tabCounts: Record<string, number> = {};
  for (const row of tabData) {
    tabCounts[row.tab] = (tabCounts[row.tab] || 0) + 1;
  }
  const totalTabOpens = tabData.length;
  const sortedTabs = Object.entries(tabCounts).sort((a, b) => b[1] - a[1]);
  const maxTabCount = sortedTabs[0]?.[1] || 1;

  // Per-student tab history
  const studentTabHistory = tabData.filter(t => t.roll_number === selectedStudent);

  // Stats
  const totalStudents = students.length;
  const activeToday = students.filter(s => {
    return new Date(s.last_seen).toDateString() === new Date().toDateString();
  }).length;

  const specCounts: Record<string, number> = {};
  students.forEach(s => { specCounts[s.specialization] = (specCounts[s.specialization] || 0) + 1; });

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

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
        <p className="font-semibold text-white text-sm">📊 Analytics</p>
        <button onClick={load} className="text-xs px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl p-3" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-xl font-black text-white">{totalStudents}</p>
          <p className="text-xs mt-0.5" style={{ color: '#a78bfa' }}>Students</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <p className="text-xl font-black text-white">{activeToday}</p>
          <p className="text-xs mt-0.5" style={{ color: '#34d399' }}>Active today</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <p className="text-xl font-black text-white">{totalTabOpens}</p>
          <p className="text-xs mt-0.5" style={{ color: '#fbbf24' }}>Tab opens</p>
        </div>
      </div>

      {/* Section toggle */}
      <div className="flex gap-2">
        {(['tabs', 'students'] as const).map(s => (
          <button key={s} onClick={() => { setActiveSection(s); setSelectedStudent(null); }}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: activeSection === s ? 'linear-gradient(135deg,#6366f1,#a78bfa)' : 'rgba(255,255,255,0.05)',
              color: activeSection === s ? 'white' : '#9ca3af',
            }}>
            {s === 'tabs' ? '📱 Tab Analytics' : '👥 Students'}
          </button>
        ))}
      </div>

      {/* Tab Analytics */}
      {activeSection === 'tabs' && (
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-white">Tab Popularity</p>
            {sortedTabs.map(([tab, count]) => (
              <div key={tab}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{TAB_LABELS[tab] || tab}</span>
                  <span className="text-xs font-semibold text-white">{count} opens</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(count / maxTabCount) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                    }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent tab activity */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-white mb-3">Recent Activity</p>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {tabData.slice(0, 50).map(row => (
                <div key={row.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">{row.name}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      {TAB_LABELS[row.tab] || row.tab}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: '#4b5563' }}>
                    {formatDistanceToNow(new Date(row.accessed_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Students section */}
      {activeSection === 'students' && (
        <div className="space-y-3">
          {/* Specialization breakdown */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>By Specialization</p>
            <div className="space-y-1.5">
              {Object.entries(specCounts).sort((a, b) => b[1] - a[1]).map(([spec, count]) => (
                <div key={spec} className="flex items-center gap-2">
                  <span className="text-xs w-24 truncate" style={{ color: '#9ca3af' }}>{spec}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${(count / totalStudents) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#a78bfa)' }} />
                  </div>
                  <span className="text-xs font-semibold text-white w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or roll number..."
            className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />

          {/* Student list */}
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
            {filtered.map(s => (
              <div key={s.roll_number}>
                <button onClick={() => setSelectedStudent(selectedStudent === s.roll_number ? null : s.roll_number)}
                  className="w-full glass rounded-2xl p-3 flex items-center justify-between transition-all"
                  style={{
                    border: selectedStudent === s.roll_number ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    background: selectedStudent === s.roll_number ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)' }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {s.roll_number} · {s.specialization}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>
                    {formatDistanceToNow(new Date(s.last_seen), { addSuffix: true })}
                  </p>
                </button>

                {/* Tab history for selected student */}
                {selectedStudent === s.roll_number && (
                  <div className="mt-1 ml-4 rounded-xl p-3 space-y-1.5"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: '#a78bfa' }}>
                      Tab history · {studentTabHistory.length} visits
                    </p>
                    {studentTabHistory.length === 0 ? (
                      <p className="text-xs" style={{ color: '#4b5563' }}>No tab activity recorded yet</p>
                    ) : (
                      studentTabHistory.slice(0, 20).map(row => (
                        <div key={row.id} className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: '#d1d5db' }}>
                            {TAB_LABELS[row.tab] || row.tab}
                          </span>
                          <span className="text-xs" style={{ color: '#6b7280' }}>
                            {format(new Date(row.accessed_at), 'dd MMM, HH:mm')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
