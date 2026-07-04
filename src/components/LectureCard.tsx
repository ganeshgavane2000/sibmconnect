import type { Lecture } from '../types';
import { formatDisplayTime } from '../utils/timeUtils';

interface Props {
  lecture: Lecture;
  compact?: boolean;
}

export function LectureCard({ lecture, compact = false }: Props) {
  const isCancelled = lecture.status === 'cancelled';

  if (compact) {
    return (
      <div className="flex gap-3 items-start py-3 px-4 rounded-xl transition-all"
        style={{
          background: isCancelled ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isCancelled ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)'}`,
          opacity: isCancelled ? 0.7 : 1,
        }}>
        {/* Time */}
        <div className="text-right shrink-0 w-16">
          <p className="text-xs font-mono" style={{ color: '#9ca3af' }}>
            {formatDisplayTime(lecture.startTime)}
          </p>
          <p className="text-xs font-mono" style={{ color: '#6b7280' }}>
            {formatDisplayTime(lecture.endTime)}
          </p>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center pt-1">
          <div className="w-1.5 h-1.5 rounded-full mt-0.5"
            style={{ background: isCancelled ? '#ef4444' : '#6366f1' }} />
          <div className="w-px flex-1 mt-1"
            style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium leading-tight ${isCancelled ? 'line-through text-gray-500' : 'text-white'}`}>
              {lecture.subject}
            </p>
            {isCancelled && (
              <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                Cancelled
              </span>
            )}
          </div>
          {lecture.faculty && (
            <p className="text-xs mt-0.5 truncate" style={{ color: '#9ca3af' }}>{lecture.faculty}</p>
          )}
          {lecture.room && (
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>📍 {lecture.room}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl transition-all"
      style={{
        background: isCancelled ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isCancelled ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-snug ${isCancelled ? 'line-through text-gray-500' : 'text-white'}`}>
            {lecture.subject}
          </p>
          {lecture.faculty && (
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{lecture.faculty}</p>
          )}
        </div>
        {isCancelled && (
          <span className="text-xs px-2 py-1 rounded-lg ml-2 shrink-0 font-medium"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            Cancelled
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs" style={{ color: '#6b7280' }}>
        <span className="font-mono">
          {formatDisplayTime(lecture.startTime)} – {formatDisplayTime(lecture.endTime)}
        </span>
        {lecture.room && <span>· {lecture.room}</span>}
      </div>
    </div>
  );
}
