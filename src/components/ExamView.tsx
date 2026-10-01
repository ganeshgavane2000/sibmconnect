import { format, parseISO, isToday } from 'date-fns';
import type { StudentProfile, Specialization, Minor } from '../types';

interface Exam {
  date: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  subject: string;
  category: 'core' | 'specialization' | 'minor';
  specializations?: Specialization[];
  minors?: Minor[];
}

const ALL_EXAMS: Exam[] = [
  // Sat 31 Oct — Specialization exams
  { date: '2026-10-31', startTime: '13:30', endTime: '15:30', courseCode: '201410305', subject: 'Brand Management', category: 'specialization', specializations: ['Marketing A', 'Marketing B'] },
  { date: '2026-10-31', startTime: '13:30', endTime: '15:30', courseCode: '201410307', subject: 'Organizational Development and Change', category: 'specialization', specializations: ['HR'] },
  { date: '2026-10-31', startTime: '13:30', endTime: '15:30', courseCode: '201410309', subject: 'Derivative Markets', category: 'specialization', specializations: ['Finance'] },
  { date: '2026-10-31', startTime: '13:30', endTime: '15:30', courseCode: '201410311', subject: 'Digital Manufacturing and Analytics', category: 'specialization', specializations: ['Operations'] },
  // Mon 02 Nov
  { date: '2026-11-02', startTime: '13:30', endTime: '15:30', courseCode: '201410306', subject: 'Business to Business Marketing', category: 'specialization', specializations: ['Marketing A', 'Marketing B'] },
  { date: '2026-11-02', startTime: '13:30', endTime: '15:30', courseCode: '201410308', subject: 'Performance Management System', category: 'specialization', specializations: ['HR'] },
  { date: '2026-11-02', startTime: '13:30', endTime: '15:30', courseCode: '201410310', subject: 'Fixed Income Markets', category: 'specialization', specializations: ['Finance'] },
  { date: '2026-11-02', startTime: '13:30', endTime: '15:30', courseCode: '201410312', subject: 'Lean Six Sigma', category: 'specialization', specializations: ['Operations'] },
  // Tue 03 Nov — Minor Round 1
  { date: '2026-11-03', startTime: '13:30', endTime: '15:30', courseCode: '201410315', subject: 'Customer Relationship Management', category: 'minor', minors: ['Marketing'] },
  { date: '2026-11-03', startTime: '13:30', endTime: '15:30', courseCode: '201410320', subject: 'HR Analytics', category: 'minor', minors: ['HR'] },
  { date: '2026-11-03', startTime: '13:30', endTime: '15:30', courseCode: '201410323', subject: 'Financial Engineering and Analytics', category: 'minor', minors: ['Finance'] },
  { date: '2026-11-03', startTime: '13:30', endTime: '15:30', courseCode: '201410331', subject: 'Digital Transformation', category: 'minor', minors: ['Data Analytics'] },
  // Wed 04 Nov — Minor Round 2
  { date: '2026-11-04', startTime: '13:30', endTime: '15:30', courseCode: '201410316', subject: 'Digital Marketing', category: 'minor', minors: ['Marketing'] },
  { date: '2026-11-04', startTime: '13:30', endTime: '15:30', courseCode: '201410321', subject: 'Leadership and Capacity Building', category: 'minor', minors: ['HR'] },
  { date: '2026-11-04', startTime: '13:30', endTime: '15:30', courseCode: '201410324', subject: 'Financial Risk Management', category: 'minor', minors: ['Finance'] },
  { date: '2026-11-04', startTime: '13:30', endTime: '15:30', courseCode: '201410333', subject: 'Internet of Things', category: 'minor', minors: ['Data Analytics'] },
  // Thu 05 Nov — Minor Round 3
  { date: '2026-11-05', startTime: '13:30', endTime: '15:30', courseCode: '201410317', subject: 'Retail Marketing', category: 'minor', minors: ['Marketing'] },
  { date: '2026-11-05', startTime: '13:30', endTime: '15:30', courseCode: '201410322', subject: 'Technology in HR/SAP HR/People Soft', category: 'minor', minors: ['HR'] },
  { date: '2026-11-05', startTime: '13:30', endTime: '15:30', courseCode: '201410325', subject: 'International Finance', category: 'minor', minors: ['Finance'] },
  { date: '2026-11-05', startTime: '13:30', endTime: '15:30', courseCode: '201410334', subject: 'Mobile Analytics', category: 'minor', minors: ['Data Analytics'] },
  // Mon 16 Nov — Minor Round 4
  { date: '2026-11-16', startTime: '13:30', endTime: '15:30', courseCode: '201410318', subject: 'Services Marketing', category: 'minor', minors: ['Marketing'] },
  { date: '2026-11-16', startTime: '13:30', endTime: '15:30', courseCode: '201410319', subject: 'Assessment Centres and HRD Instruments', category: 'minor', minors: ['HR'] },
  { date: '2026-11-16', startTime: '13:30', endTime: '15:30', courseCode: '201410326', subject: 'Mergers and Acquisitions', category: 'minor', minors: ['Finance'] },
  { date: '2026-11-16', startTime: '13:30', endTime: '15:30', courseCode: '201410332', subject: 'Innovation Management', category: 'minor', minors: ['Data Analytics'] },
  // Tue 17 Nov — Core
  { date: '2026-11-17', startTime: '12:30', endTime: '15:30', courseCode: '201410302', subject: 'Strategic Management', category: 'core' },
];

function getStudentExams(profile: StudentProfile): Exam[] {
  const seen = new Set<string>();
  return ALL_EXAMS
    .filter(e => {
      if (e.category === 'core') return true;
      if (e.category === 'specialization') return e.specializations?.includes(profile.specialization);
      if (e.category === 'minor') return e.minors?.some(m => m === profile.minor);
      return false;
    })
    .filter(e => {
      const key = `${e.date}_${e.courseCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date));
}

function fmt(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const CAT = {
  core: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'Core' },
  specialization: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Spec' },
  minor: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Minor' },
};

export function ExamView({ profile }: { profile: StudentProfile }) {
  const exams = getStudentExams(profile);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const byDate = new Map<string, Exam[]>();
  for (const e of exams) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const upcoming = Array.from(byDate.entries()).filter(([d]) => d >= todayStr);
  const past = Array.from(byDate.entries()).filter(([d]) => d < todayStr);
  const nextExam = upcoming[0];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Exam Schedule</h2>
        </div>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
          {profile.specialization} · {profile.minor !== 'None' ? `${profile.minor} Minor` : 'No minor'} · {exams.length} exams
        </p>
      </div>

      {nextExam && (
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#f87171' }}>📅 Next Exam</p>
          <p className="font-bold text-white text-sm">{nextExam[1][0].subject}</p>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
            {format(parseISO(nextExam[0]), 'EEEE, d MMMM yyyy')} · {fmt(nextExam[1][0].startTime)}
          </p>
        </div>
      )}

      {upcoming.map(([date, dayExams]) => {
        const d = parseISO(date);
        const examToday = isToday(d);
        return (
          <div key={date}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                style={{ background: examToday ? 'linear-gradient(135deg,#ef4444,#f87171)' : 'rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-bold text-white leading-none">{format(d,'EEE').toUpperCase()}</p>
                <p className="text-xs text-white/70 leading-none mt-0.5">{format(d,'d')}</p>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{format(d,'EEEE, d MMMM')}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{dayExams.length} exam{dayExams.length > 1 ? 's' : ''}</p>
              </div>
              {examToday && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>TODAY</span>
              )}
            </div>
            <div className="space-y-2">
              {dayExams.map(exam => {
                const s = CAT[exam.category];
                return (
                  <div key={exam.courseCode} className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white text-sm leading-snug">{exam.subject}</p>
                      <span className="text-xs px-2 py-0.5 rounded-lg shrink-0 font-medium"
                        style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: '#6b7280' }}>
                      <span className="font-mono">{fmt(exam.startTime)} – {fmt(exam.endTime)}</span>
                      <span>· {exam.courseCode}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#4b5563' }}>Completed</p>
          <div className="space-y-2 opacity-40">
            {past.flatMap(([date, dayExams]) =>
              dayExams.map(exam => (
                <div key={`${date}_${exam.courseCode}`}
                  className="rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-sm font-medium text-white line-through">{exam.subject}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{format(parseISO(date),'d MMM')} · {fmt(exam.startTime)}</p>
                  </div>
                  <span className="text-xs" style={{ color: '#4b5563' }}>Done ✓</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {exams.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-3xl mb-3">📝</p>
          <p className="font-semibold text-white">No exams found</p>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Check your profile settings</p>
        </div>
      )}
    </div>
  );
}
