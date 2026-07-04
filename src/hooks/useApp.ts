import { useState, useEffect, useCallback, useRef } from 'react';
import { loadProfile, saveProfile, saveTimetable, loadTimetable, getLastUpdated } from '../store/storage';
import { fetchTimetableFromCloud, pushTimetableToCloud, logStudentActivity } from '../store/supabase';
import { fetchAndParseGoogleSheet } from '../utils/sheetsParser';
import type { Lecture, StudentProfile, ParseReport } from '../types';
import { parseExcelFile } from '../utils/excelParser';

export type AppView = 'dashboard' | 'today' | 'week' | 'mess' | 'bus';

// Auto-sync from Google Sheets every 15 minutes
const SYNC_INTERVAL_MS = 15 * 60 * 1000;

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

  // Pull from cloud (Supabase) - for students reading the live timetable
  const syncFromCloud = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const { lectures: cloud, updatedAt } = await fetchTimetableFromCloud();
      if (cloud.length > 0) {
        setLectures(cloud);
        saveTimetable(cloud);
        if (updatedAt) setLastSyncTime(updatedAt);
        setCloudError(null);
      }
    } catch {
      if (!silent) setCloudError('Could not reach server. Showing cached timetable.');
    } finally {
      if (!silent) setSyncing(false);
    }
  }, []);

  // Pull from Google Sheets → parse → push to Supabase (admin action)
  const syncFromSheets = useCallback(async (): Promise<ParseReport> => {
    setSyncStatus('syncing');
    try {
      const { lectures: parsed, report } = await fetchAndParseGoogleSheet();

      if (parsed.length > 0) {
        saveTimetable(parsed);
        setLectures(parsed);

        const ok = await pushTimetableToCloud(parsed);
        if (!ok) {
          report.warnings.push('⚠️ Could not push to cloud. Changes saved locally only.');
        }
        setLastSyncTime(new Date().toISOString());
      }

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return report;
    } catch (err) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 4000);
      return {
        total: 0, imported: 0, skipped: 0,
        warnings: [`Sync failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const p = loadProfile();
      setProfile(p);

      // Log usage for admin analytics (silent, non-blocking)
      if (p) logStudentActivity(p);

      // Load local cache immediately
      const cached = loadTimetable();
      if (cached.length > 0) setLectures(cached);

      // Sync from cloud
      await syncFromCloud();
      setLoading(false);
    };
    init();

    // Auto sync from cloud every 15 min (so students always have fresh data)
    syncTimerRef.current = setInterval(() => syncFromCloud(true), SYNC_INTERVAL_MS);
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, []);

  const handleOnboarding = useCallback((p: StudentProfile) => {
    saveProfile(p);
    setProfile(p);
    logStudentActivity(p);
  }, []);

  const handleProfileUpdate = useCallback((p: StudentProfile) => {
    saveProfile(p);
    setProfile(p);
    logStudentActivity(p);
  }, []);

  const handleExcelUpload = useCallback(async (file: File) => {
    setImportLoading(true);
    setImportReport(null);
    try {
      const { lectures: parsed, report } = await parseExcelFile(file);

      // Safety: never overwrite an existing timetable with an empty result
      if (parsed.length === 0) {
        setImportReport(report);
        return;
      }

      saveTimetable(parsed);
      setLectures(parsed);

      const ok = await pushTimetableToCloud(parsed);
      if (!ok) report.warnings.push('⚠️ Cloud sync failed — saved locally only.');

      setImportReport(report);
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      setImportReport({
        total: 0, imported: 0, skipped: 0,
        warnings: [`Error: ${err instanceof Error ? err.message : String(err)}`],
      });
    } finally {
      setImportLoading(false);
    }
  }, []);

  return {
    profile,
    lectures,
    view,
    setView,
    loading,
    syncing,
    syncStatus,
    importLoading,
    importReport,
    cloudError,
    lastSyncTime,
    handleOnboarding,
    handleProfileUpdate,
    handleExcelUpload,
    syncFromSheets,
    syncFromCloud,
  };
}
