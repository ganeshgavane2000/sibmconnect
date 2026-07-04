import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pnqrksjddknvwsvbodvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucXJrc2pkZGtudndzdmJvZHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjExMzUsImV4cCI6MjA5ODIzNzEzNX0.wSUh7422TFXr3ej1uLySc9OKmUIJFYBjbhvmIQ8osNM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchTimetableFromCloud(): Promise<{ lectures: any[]; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('timetable')
    .select('lectures, updated_at')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return { lectures: [], updatedAt: null };
  return { lectures: data.lectures || [], updatedAt: data.updated_at };
}

export async function pushTimetableToCloud(lectures: any[]): Promise<boolean> {
  // Always upsert into row id=1
  const { error } = await supabase
    .from('timetable')
    .upsert({ id: 1, lectures, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  return !error;
}

export async function fetchMessMenuFromCloud(): Promise<{ menu: any; weekOf: string | null; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('mess_menu')
    .select('menu, week_of, updated_at')
    .eq('id', 1)
    .single();

  if (error || !data) return { menu: null, weekOf: null, updatedAt: null };
  return { menu: data.menu, weekOf: data.week_of, updatedAt: data.updated_at };
}

export async function pushMessMenuToCloud(menu: any, weekOf: string): Promise<boolean> {
  const { error } = await supabase
    .from('mess_menu')
    .upsert({ id: 1, menu, week_of: weekOf, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  return !error;
}

// ── Campus Info (bus timings, hostel timings) ──
export async function fetchCampusInfoFromCloud(): Promise<{ info: any; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('campus_info')
    .select('info, updated_at')
    .eq('id', 1)
    .single();
  if (error || !data) return { info: null, updatedAt: null };
  return { info: data.info, updatedAt: data.updated_at };
}

export async function pushCampusInfoToCloud(info: any): Promise<boolean> {
  const { error } = await supabase
    .from('campus_info')
    .upsert({ id: 1, info, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  return !error;
}

// ── Analytics: track student logins/usage ──
export async function logStudentActivity(profile: {
  name: string;
  rollNumber: string;
  specialization: string;
  minor: string;
}): Promise<void> {
  try {
    await supabase.from('student_activity').upsert(
      {
        roll_number: profile.rollNumber,
        name: profile.name,
        specialization: profile.specialization,
        minor: profile.minor,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'roll_number' }
    );
  } catch {
    // Silent fail — analytics should never block the app
  }
}

export async function fetchStudentActivity(): Promise<any[]> {
  const { data, error } = await supabase
    .from('student_activity')
    .select('*')
    .order('last_seen', { ascending: false });
  if (error || !data) return [];
  return data;
}
