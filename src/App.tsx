import { useState } from 'react';
import { useApp } from './hooks/useApp';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { TodayView } from './components/TodayView';
import { WeekView } from './components/WeekView';
import { MessMenuView } from './components/MessMenuView';
import { BusTimingsView } from './components/BusTimingsView';
import { AdminPanel } from './components/AdminPanel';
import { BottomNav } from './components/BottomNav';
import { ProfileEditor } from './components/ProfileEditor';
import { format } from 'date-fns';

function App() {
  const {
    profile, lectures, view, setView,
    loading, syncing, syncStatus,
    importLoading, importReport, cloudError, lastSyncTime,
    handleOnboarding, handleProfileUpdate,
    handleExcelUpload, syncFromSheets, syncFromCloud,
  } = useApp();

  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: '#6b7280' }}>Syncing timetable...</p>
      </div>
    );
  }

  if (!profile) return <Onboarding onComplete={handleOnboarding} />;

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
      </div>

      <div className="max-w-sm mx-auto px-4 pt-6 pb-32 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              <span className="text-xs font-black text-white">S</span>
            </div>
            <span className="font-bold text-white text-sm">SIBM Connect</span>
            {syncing && (
              <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin ml-1" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', color: 'white' }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
                {profile.name.split(' ')[0]}
              </span>
            </button>
            <button
              onClick={() => setShowAdmin(true)}
              className="text-xs px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              Admin?
            </button>
          </div>
        </div>

        {cloudError && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-xs"
            style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
            ⚠️ {cloudError}
          </div>
        )}

        {lastSyncTime && !showAdmin && (
          <div className="mb-4 flex items-center gap-1.5 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Synced {format(new Date(lastSyncTime), 'dd MMM, HH:mm')}
            </p>
            <button onClick={() => syncFromCloud()}
              className="text-xs ml-auto" style={{ color: '#6366f1' }}>
              Refresh
            </button>
          </div>
        )}

        {showAdmin ? (
          <AdminPanel
            onUpload={handleExcelUpload}
            onSyncSheets={syncFromSheets}
            loading={importLoading}
            syncStatus={syncStatus}
            report={importReport}
            onClose={() => { setShowAdmin(false); setView('dashboard'); }}
          />
        ) : (
          <>
            {view === 'dashboard' && <Dashboard profile={profile} lectures={lectures} />}
            {view === 'today' && <TodayView profile={profile} lectures={lectures} />}
            {view === 'week' && <WeekView profile={profile} lectures={lectures} />}
            {view === 'mess' && <MessMenuView />}
            {view === 'bus' && <BusTimingsView />}
          </>
        )}
      </div>

      {!showAdmin && <BottomNav current={view} onChange={setView} />}

      {showProfile && (
        <ProfileEditor
          profile={profile}
          onSave={handleProfileUpdate}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

export default App;
