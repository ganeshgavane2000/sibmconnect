import { useState } from 'react';
import { format, parseISO, isToday as checkToday, addDays, subDays } from 'date-fns';
import type { Lecture, StudentProfile } from '../types';
import { CurrentClassCard } from './CurrentClassCard';
import { NextClassCard } from './NextClassCard';
import { LectureCard } from './LectureCard';
import { useClock } from '../hooks/useClock';
import { getCurrentLecture, getNextLecture, getStudentLectures } from '../utils/timeUtils';

interface Props {
  profile: StudentProfile;
  lectures: Lecture[];
}

export function Dashboard({ profile, lectures }: Props) {
  const { displayDate } = useClock();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const isToday = selectedDate === todayStr;
  const current = isToday ? getCurrentLecture(lectures, profile) : null;
  const next = isToday ? getNextLecture(lectures, profile) : null;

  const studentLectures = getStudentLectures(lectures, profile);
  const dayLectures = studentLectures
    .filter(l => l.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const noTimetable = lectures.length === 0;

  const changeDate = (dir: -1 | 1) => {
    const d = parseISO(selectedDate);
    setSelectedDate(format(dir === 1 ? addDays(d, 1) : subDays(d, 1), 'yyyy-MM-dd'));
  };

  const displayLabel = isToday
    ? 'Today'
    : format(parseISO(selectedDate), 'EEEE, d MMM');

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm" style={{ color: '#9ca3af' }}>{displayDate}</p>
        <h2 className="text-2xl font-bold text-white mt-0.5">
          Hey, {profile.name.split(' ')[0]} 👋
        </h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
          {profile.specialization} · {profile.minor !== 'None' ? `Minor: ${profile.minor}` : 'No minor'}
        </p>
      </div>

      {noTimetable ? (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-white">No timetable yet</p>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
            Ask your admin to upload the timetable
          </p>
        </div>
      ) : (
        <>
          {/* Live cards only for today */}
          {isToday && <CurrentClassCard lecture={current} />}
          {isToday && next && !current && <NextClassCard lecture={next} />}

          {/* Date selector */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => changeDate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
            >
              ‹
            </button>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{displayLabel}</span>
              {isToday && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(99,102,241,0.25)', color: '#a78bfa' }}>
                  Today
                </span>
              )}
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-xs px-2 py-0.5 rounded-full font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
                >
                  Back to today
                </button>
              )}
            </div>

            {/* Native date picker hidden behind a button */}
            <div className="relative">
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
                onClick={() => changeDate(1)}
              >
                ›
              </button>
            </div>
          </div>

          {/* Date picker row */}
          <div className="flex items-center justify-center">
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-base">📅</span>
              <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>Pick a date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
                style={{ position: 'absolute' }}
              />
            </label>
          </div>

          {/* Classes for selected date */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">
                {isToday ? "Today's Classes" : 'Classes'}
              </h3>
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
                {dayLectures.filter(l => l.status !== 'cancelled').length} active
              </span>
            </div>

            {dayLectures.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm text-white font-medium">No classes on this day</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  {isToday ? 'Enjoy your day off' : 'Nothing scheduled'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayLectures.map(l => (
                  <LectureCard key={l.id} lecture={l} compact />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
