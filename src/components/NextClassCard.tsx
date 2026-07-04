import { useEffect, useState } from 'react';
import type { Lecture } from '../types';
import {
  formatDisplayTime,
  getMinutesUntil,
  formatTimeUntil,
  getUrgencyColor,
  getUrgencyBg,
} from '../utils/timeUtils';

interface Props {
  lecture: Lecture | null;
}

export function NextClassCard({ lecture }: Props) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!lecture) return;
    const update = () => setMinutes(getMinutesUntil(lecture.startTime));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lecture]);

  if (!lecture) return null;

  const bg = getUrgencyBg(minutes);
  const color = getUrgencyColor(minutes);

  return (
    <div className={`rounded-3xl p-5 bg-gradient-to-br ${bg} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: '#9ca3af' }}>Next Up</p>
          <h3 className="text-base font-bold text-white leading-tight">{lecture.subject}</h3>
          {lecture.faculty && (
            <p className="text-sm mt-0.5" style={{ color: '#d1d5db' }}>{lecture.faculty}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="font-mono" style={{ color: '#9ca3af' }}>
              {formatDisplayTime(lecture.startTime)}
            </span>
            {lecture.room && (
              <span style={{ color: '#9ca3af' }}>· {lecture.room}</span>
            )}
          </div>
        </div>

        {/* Countdown */}
        <div className="text-right shrink-0 ml-4">
          <p className={`text-2xl font-black ${color}`}>{formatTimeUntil(minutes)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>to start</p>
        </div>
      </div>

      {minutes <= 10 && (
        <div className="mt-3 px-3 py-2 rounded-xl text-xs font-medium"
          style={{
            background: minutes <= 5 ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
            color: minutes <= 5 ? '#f87171' : '#fb923c',
          }}>
          {minutes <= 5 ? '🔴 Head to class now!' : '🟠 Get ready to leave'}
        </div>
      )}
    </div>
  );
}
