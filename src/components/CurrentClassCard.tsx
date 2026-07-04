import { useEffect, useState } from 'react';
import type { Lecture } from '../types';
import { formatDisplayTime, getProgress, getMinutesUntil, formatTimeUntil } from '../utils/timeUtils';

interface Props {
  lecture: Lecture | null;
}

export function CurrentClassCard({ lecture }: Props) {
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!lecture) return;

    const update = () => {
      setProgress(getProgress(lecture.startTime, lecture.endTime));
      const mins = getMinutesUntil(lecture.endTime);
      setRemaining(formatTimeUntil(mins));
    };

    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lecture]);

  if (!lecture) {
    return (
      <div className="glass rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            ☕
          </div>
          <div>
            <p className="font-semibold text-white">No Class in Session</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Enjoy your free time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(167,139,250,0.15))',
        border: '1px solid rgba(99,102,241,0.3)',
        boxShadow: '0 0 40px rgba(99,102,241,0.1)',
      }}>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span className="text-xs font-medium" style={{ color: '#f87171' }}>LIVE</span>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: '#a78bfa' }}>Current Class</p>
        <h3 className="text-xl font-bold text-white leading-tight">{lecture.subject}</h3>
        {lecture.faculty && (
          <p className="text-sm mt-1" style={{ color: '#c4b5fd' }}>{lecture.faculty}</p>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Time</p>
          <p className="font-mono text-white font-medium">
            {formatDisplayTime(lecture.startTime)} – {formatDisplayTime(lecture.endTime)}
          </p>
        </div>
        {lecture.room && (
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Room</p>
            <p className="font-medium text-white">{lecture.room}</p>
          </div>
        )}
        <div className="ml-auto text-right">
          <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Remaining</p>
          <p className="font-bold text-white">{remaining}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
          }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1.5" style={{ color: '#9ca3af' }}>
        <span>{Math.round(progress)}% done</span>
        <span>{formatDisplayTime(lecture.endTime)}</span>
      </div>
    </div>
  );
}
