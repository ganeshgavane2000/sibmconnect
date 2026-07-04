import { isStudentApplicable } from './audienceParser';
import type { Lecture, StudentProfile } from '../types';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';

export function getStudentLectures(lectures: Lecture[], profile: StudentProfile): Lecture[] {
  return lectures.filter(l =>
    isStudentApplicable(l.audiences, profile.specialization, profile.minor)
  );
}

export function getTodayLectures(lectures: Lecture[], profile: StudentProfile): Lecture[] {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return getStudentLectures(lectures, profile)
    .filter(l => l.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getWeekLectures(lectures: Lecture[], profile: StudentProfile): Lecture[] {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  return getStudentLectures(lectures, profile)
    .filter(l => {
      if (!l.date) return false;
      const d = parseISO(l.date);
      return d >= weekStart && d <= weekEnd;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
}

export function getCurrentLecture(lectures: Lecture[], profile: StudentProfile): Lecture | null {
  const todayLectures = getTodayLectures(lectures, profile);
  const now = format(new Date(), 'HH:mm');

  return todayLectures.find(l => {
    if (l.status === 'cancelled') return false;
    return l.startTime <= now && now <= l.endTime;
  }) || null;
}

export function getNextLecture(lectures: Lecture[], profile: StudentProfile): Lecture | null {
  const todayLectures = getTodayLectures(lectures, profile);
  const now = format(new Date(), 'HH:mm');

  return todayLectures.find(l => {
    if (l.status === 'cancelled') return false;
    return l.startTime > now;
  }) || null;
}

export function getProgress(startTime: string, endTime: string): number {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const total = end - start;
  if (total <= 0) return 0;

  const elapsed = nowMinutes - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getMinutesUntil(timeStr: string): number {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000));
}

export function formatTimeUntil(minutes: number): string {
  if (minutes < 1) return 'Starting now';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getUrgencyColor(minutes: number): string {
  if (minutes <= 5) return 'text-red-400';
  if (minutes <= 15) return 'text-orange-400';
  return 'text-emerald-400';
}

export function getUrgencyBg(minutes: number): string {
  if (minutes <= 5) return 'from-red-500/20 to-red-900/10 border-red-500/30';
  if (minutes <= 15) return 'from-orange-500/20 to-orange-900/10 border-orange-500/30';
  return 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30';
}

export function formatDisplayTime(t: string): string {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function getDayName(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  try {
    return days[parseISO(dateStr).getDay()];
  } catch {
    return '';
  }
}
