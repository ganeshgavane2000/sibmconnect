import { useState, useRef } from 'react';
import type { ParseReport } from '../types';
import { getLastUpdated } from '../store/storage';
import { format } from 'date-fns';
import { MessMenuUpload } from './MessMenuUpload';
import { CampusInfoUpload } from './CampusInfoUpload';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface Props {
  onUpload: (file: File) => Promise<void>;
  onSyncSheets: () => Promise<ParseReport>;
  loading: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  report: ParseReport | null;
  onClose: () => void;
}

const ADMIN_PASSWORD = 'sibmadmin2024';

type Tab = 'timetable' | 'mess' | 'bus' | 'analytics';

export function AdminPanel({ onUpload, onSyncSheets, loading, syncStatus, report, onClose }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [sheetReport, setSheetReport] = useState<ParseReport | null>(null);
  const [tab, setTab] = useState<Tab>('timetable');
  const fileRef = useRef<HTMLInputElement>(null);
  const lastUpdated = getLastUpdated();

  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) { setAuthenticated(true); setAuthError(''); }
    else setAuthError('Incorrect password');
  };

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|xlsm)$/i)) {
      setFileError('Please upload an Excel file (.xlsx, .xls)');
      return;
    }
    setFileError('');
    onUpload(file);
  };

  const handleSyncSheets = async () => {
    const confirmed = window.confirm(
      'This will pull the timetable from the college Google Sheet and OVERWRITE your current Excel-uploaded timetable for all students. Continue?'
    );
    if (!confirmed) return;

    setSheetReport(null);
    const r = await onSyncSheets();
    setSheetReport(r);
  };

  const syncLabel = {
    idle: '🔄 Sync from Google Sheets (overwrites Excel data)',
    syncing: 'Syncing...',
    success: '✅ Synced successfully!',
    error: '❌ Sync failed',
  }[syncStatus];

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'timetable', label: 'Timetable', icon: '📅' },
    { key: 'mess', label: 'Mess', icon: '🍽️' },
    { key: 'bus', label: 'Bus', icon: '🚌' },
    { key: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Manage everything from here</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400"
          style={{ background: 'rgba(255,255,255,0.06)' }}>✕</button>
      </div>

      {!authenticated ? (
        <div className="glass rounded-3xl p-6">
          <p className="font-semibold text-white mb-1">🔐 Admin Access</p>
          <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>Enter your admin password</p>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none mb-3 focus:ring-2 focus:ring-indigo-500/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            autoFocus
          />
          {authError && <p className="text-xs text-red-400 mb-3">{authError}</p>}
          <button onClick={handleAuth}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
            Authenticate
          </button>
        </div>
      ) : (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                style={{
                  background: tab === t.key ? 'linear-gradient(135deg, #6366f1, #a78bfa)' : 'rgba(255,255,255,0.05)',
                  color: tab === t.key ? 'white' : '#9ca3af',
                }}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* ── Timetable Tab ── */}
          {tab === 'timetable' && (
            <>
              {lastUpdated && (
                <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="text-xs font-medium text-white">Timetable active</p>
                    <p className="text-xs" style={{ color: '#9ca3af' }}>
                      Last updated: {format(new Date(lastUpdated), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              <div
                className="rounded-3xl p-7 text-center cursor-pointer transition-all duration-200"
                style={{
                  background: dragOver ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `2px dashed ${dragOver ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.xlsm" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
                {loading ? (
                  <div>
                    <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="font-medium text-white text-sm">Parsing...</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-2">📤</div>
                    <p className="font-medium text-white text-sm">Drop Excel file here</p>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>or tap to browse · .xlsx .xls — primary method</p>
                  </div>
                )}
              </div>

              {fileError && <p className="text-sm text-red-400 px-1">{fileError}</p>}

              {report && (
                <div className="glass rounded-3xl p-5 space-y-3">
                  <p className="font-semibold text-white text-sm">Excel Import Report</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Imported', val: report.imported, color: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', text: '#34d399' },
                      { label: 'Skipped', val: report.skipped, color: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#f87171' },
                      { label: 'Total', val: report.total, color: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'white' },
                    ].map(({ label, val, color, border, text }) => (
                      <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: color, border: `1px solid ${border}` }}>
                        <p className="text-lg font-black" style={{ color: text }}>{val}</p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  {report.warnings.slice(0, 5).map((w, i) => (
                    <p key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}>{w}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <p className="text-xs" style={{ color: '#4b5563' }}>advanced · rarely needed</p>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <div className="rounded-2xl p-4 space-y-2.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="font-medium text-white text-xs">⚠️ Sync from Google Sheets</p>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    Overwrites your Excel-uploaded timetable with the college Google Sheet. Use only if the Sheet is more current.
                  </p>
                </div>
                <button
                  onClick={handleSyncSheets}
                  disabled={syncStatus === 'syncing'}
                  className="w-full py-2.5 rounded-xl font-medium text-xs transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {syncStatus === 'syncing'
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        Syncing...
                      </span>
                    : syncLabel}
                </button>
                {sheetReport && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Imported', val: sheetReport.imported, color: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', text: '#34d399' },
                      { label: 'Skipped', val: sheetReport.skipped, color: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#f87171' },
                      { label: 'Total', val: sheetReport.total, color: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: 'white' },
                    ].map(({ label, val, color, border, text }) => (
                      <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: color, border: `1px solid ${border}` }}>
                        <p className="text-lg font-black" style={{ color: text }}>{val}</p>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {sheetReport?.warnings.map((w, i) => (
                  <p key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}>{w}</p>
                ))}
              </div>
            </>
          )}

          {/* ── Mess Tab ── */}
          {tab === 'mess' && <MessMenuUpload />}

          {/* ── Bus Tab ── */}
          {tab === 'bus' && <CampusInfoUpload />}

          {/* ── Analytics Tab ── */}
          {tab === 'analytics' && <AnalyticsDashboard />}
        </>
      )}
    </div>
  );
}
