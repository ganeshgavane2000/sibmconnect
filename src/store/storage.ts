import type { Lecture, StudentProfile } from '../types';

const TIMETABLE_KEY = 'sibm_timetable';
const PROFILE_KEY = 'sibm_profile';
const LAST_UPDATED_KEY = 'sibm_last_updated';

export function saveTimetable(lectures: Lecture[]): void {
  localStorage.setItem(TIMETABLE_KEY, JSON.stringify(lectures));
  localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
}

export function loadTimetable(): Lecture[] {
  const raw = localStorage.getItem(TIMETABLE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Lecture[];
  } catch {
    return [];
  }
}

export function saveProfile(profile: StudentProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): StudentProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function getLastUpdated(): string | null {
  return localStorage.getItem(LAST_UPDATED_KEY);
}

export function clearAll(): void {
  localStorage.removeItem(TIMETABLE_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LAST_UPDATED_KEY);
}
