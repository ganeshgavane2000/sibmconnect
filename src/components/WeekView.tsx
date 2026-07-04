import type { Lecture, StudentProfile } from '../types';
import { LectureCard } from './LectureCard';
import { getWeekLectures } from '../utils/timeUtils';
import { format, parseISO } from 'date-fns';

interface Props {
  profile: StudentProfile;
  lectures: Lecture[];
}

// removed

export function WeekView({ profile, lectures }: Props) {
  const weekLectures = getWeekLectures(lectures, profile);

  // Group by date
  const byDate = new Map<string, Lecture[]>();
  for (const l of weekLectures) {
    if (!byDate.has(l.date)) byDate.set(l.date, []);
    byDate.get(l.date)!.push(l);
  }

  const sorted = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">This Week</h2>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
          {weekLectures.length} classes scheduled
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <p className="text-3xl mb-3">🗓️</p>
          <p className="font-semibold text-white">No classes this week</p>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Check back later</p>
        </div>
      ) : (
        sorted.map(([date, dayLectures]) => {
          const d = parseISO(date);
          const dayName = format(d, 'EEEE');
          const dayDate = format(d, 'd MMM');
          const isToday = date === format(new Date(), 'yyyy-MM-dd');

          return (
            <div key={date}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? '' : ''}`}
                  style={{
                    background: isToday
                      ? 'linear-gradient(135deg, #6366f1, #a78bfa)'
                      : 'rgba(255,255,255,0.06)',
                  }}>
                  <p className="text-xs font-bold text-white leading-none">
                    {format(d, 'EEE').toUpperCase()}
                  </p>
                  <p className="text-xs text-white/70 leading-none mt-0.5">{format(d, 'd')}</p>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{dayName}</p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{dayDate} · {dayLectures.length} classes</p>
                </div>
                {isToday && (
                  <span className="ml-auto text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-1.5 ml-0">
                {dayLectures.map(l => (
                  <LectureCard key={l.id} lecture={l} compact />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
