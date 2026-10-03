import { useState, useEffect, useCallback, useRef } from 'react';
import { loadProfile, saveProfile, saveTimetable, loadTimetable, getLastUpdated } from '../store/storage';
import { fetchTimetableFromCloud, pushTimetableToCloud, logStudentActivity, fetchY1TimetableFromCloud } from '../store/supabase';
import { fetchAndParseGoogleSheet } from '../utils/sheetsParser';
import type { Lecture, StudentProfile, ParseReport } from '../types';
import { parseExcelFile } from '../utils/excelParser';

export type AppView = 'dashboard' | 'week' | 'exams' | 'mess' | 'bus';

const SYNC_INTERVAL_MS = 15 * 60 * 1000;
const Y1_STORAGE_KEY = 'sibm_timetable_y1';

export function useApp() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [view, setView] = useState<AppView>('dashboard');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [importLoading, setImportLoading] = useState(false);
  const [importReport, setImportReport] = useState<ParseReport | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncFromCloud = useCallback(async (p?: StudentProfile | null, silent = false) => {
    const profile_ = p;
    if (!silent) setSyncing(true);
    try {
      let cloud: any[] = [];
      let updatedAt: string | null = null;

      if (profile_?.year === 'Y1') {
        const res = await fetchY1TimetableFromCloud();
        cloud = res.lectures;
        updatedAt = res.updatedAt;
      } else {
        const res = await fetchTimetableFromCloud();
        cloud = res.lectures;
        updatedAt = res.updatedAt;
      }

      if (cloud.length > 0) {
        setLectures(cloud);
        if (profile_?.year === 'Y1') {
          localStorage.setItem(Y1_STORAGE_KEY, JSON.stringify(cloud));
        } else {
          saveTimetable(cloud);
        }
        if (updatedAt) setLastSyncTime(updatedAt);
        setCloudError(null);
      }
    } catch {
      if (!silent) setCloudError('Could not reach server. Showing cached timetable.');
    } finally {
      if (!silent) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const p = loadProfile();
      setProfile(p);

      if (p) logStudentActivity(p);

      // Load cache
      if (p?.year === 'Y1') {
        const cached = localStorage.getItem(Y1_STORAGE_KEY);
        if (cached) setLectures(JSON.parse(cached));
      } else {
        const cached = loadTimetable();
        if (cached.length > 0) setLectures(cached);
      }

      await syncFromCloud(p);
      setLoading(false);
    };
    init();

    syncTimerRef.current = setInterval(() => {
      const p = loadProfile();
      syncFromCloud(p, true);
    }, SYNC_INTERVAL_MS);

    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, []);

  const handleOnboarding = useCallback((p: StudentProfile) => {
    saveProfile(p);
    setProfile(p);
    logStudentActivity(p);
    syncFromCloud(p);
  }, [syncFromCloud]);

  const handleProfileUpdate = useCallback((p: StudentProfile) => {
    saveProfile(p);
    setProfile(p);
    logStudentActivity(p);
    syncFromCloud(p);
  }, [syncFromCloud]);

  const syncFromSheets = useCallback(async (): Promise<ParseReport> => {
    setSyncStatus('syncing');
    try {
      const { lectures: parsed, report } = await fetchAndParseGoogleSheet();
      if (parsed.length > 0) {
        saveTimetable(parsed);
        setLectures(parsed);
        const ok = await pushTimetableToCloud(parsed);
        if (!ok) report.warnings.push('⚠️ Could not push to cloud.');
        setLastSyncTime(new Date().toISOString());
      }
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return report;
    } catch (err) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 4000);
      return { total: 0, imported: 0, skipped: 0, warnings: [`Sync failed: ${err instanceof Error ? err.message : String(err)}`] };
    }
  }, []);

  const handleExcelUpload = useCallback(async (file: File) => {
    setImportLoading(true);
    setImportReport(null);
    try {
      const { lectures: parsed, report } = await parseExcelFile(file);
      if (parsed.length === 0) { setImportReport(report); return; }

      saveTimetable(parsed);
      setLectures(parsed);
      const ok = await pushTimetableToCloud(parsed);
      if (!ok) report.warnings.push('⚠️ Cloud sync failed.');
      setImportReport(report);
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      setImportReport({ total: 0, imported: 0, skipped: 0, warnings: [`Error: ${err instanceof Error ? err.message : String(err)}`] });
    } finally {
      setImportLoading(false);
    }
  }, []);

  return {
    profile, lectures, setLectures, view, setView,
    loading, syncing, syncStatus,
    importLoading, importReport, cloudError, lastSyncTime,
    handleOnboarding, handleProfileUpdate,
    handleExcelUpload, syncFromSheets,
    syncFromCloud: () => syncFromCloud(profile),
  };
}
