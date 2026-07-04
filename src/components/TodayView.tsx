import type { Lecture, StudentProfile } from '../types';
import { LectureCard } from './LectureCard';
import { getTodayLectures } from '../utils/timeUtils';
import { format } from 'date-fns';

interface Props {
  profile: StudentProfile;
  lectures: Lecture[];
}

export function TodayView({ profile, lectures }: Props) {
  const today = getTodayLectures(lectures, profile);
  const now = format(new Date(), 'HH:mm');

  const past = today.filter(l => l.endTime < now && l.status !== 'cancelled');
  const upcoming = today.filter(l => l.startTime >= now || l.status === 'cancelled');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Today</h2>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {today.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-4xl mb-3">🌴</p>
          <p className="font-semibold text-white">No classes today</p>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
            {lectures.length === 0 ? 'No timetable loaded yet' : 'Enjoy your free day!'}
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: '#6b7280' }}>Upcoming</p>
              <div className="space-y-2">
                {upcoming.map(l => (
                  <LectureCard key={l.id} lecture={l} compact />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: '#4b5563' }}>Completed</p>
              <div className="space-y-2 opacity-50">
                {past.map(l => (
                  <LectureCard key={l.id} lecture={l} compact />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
