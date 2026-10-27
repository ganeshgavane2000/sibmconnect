import { useEffect, useState } from 'react';
import { useApp } from './hooks/useApp';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { MessMenuView } from './components/MessMenuView';
import { BusTimingsView } from './components/BusTimingsView';
import { logTabActivity } from './store/supabase';
import { ExamView } from './components/ExamView';
import { AdminPanel } from './components/AdminPanel';
import { BottomNav } from './components/BottomNav';
import { ProfileEditor } from './components/ProfileEditor';
import { format } from 'date-fns';

type IntroStage = 'hello' | 'welcome' | 'exit';

function App() {
  const {
    profile, lectures, setLectures, view, setView,
    loading, syncing, syncStatus,
    importLoading, importReport, cloudError, lastSyncTime,
    handleOnboarding, handleProfileUpdate,
    handleExcelUpload, syncFromSheets, syncFromCloud,
  } = useApp();

  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [introStage, setIntroStage] = useState<IntroStage | null>(null);

  useEffect(() => {
    if (!profile || loading) return;
    const sessionKey = 'sibm-connect-intro-shown';
    if (sessionStorage.getItem(sessionKey)) return;

    sessionStorage.setItem(sessionKey, '1');
    setIntroStage('hello');
    const welcomeTimer = window.setTimeout(() => setIntroStage('welcome'), 1350);
    const exitTimer = window.setTimeout(() => setIntroStage('exit'), 2950);
    const finishTimer = window.setTimeout(() => setIntroStage(null), 3850);

    return () => {
      window.clearTimeout(welcomeTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, [profile, loading]);

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    if (profile) logTabActivity({ name: profile.name, rollNumber: profile.rollNumber }, newView);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              <span className="text-xs font-black text-white">S</span>
            </div>
            <span className="font-bold text-white text-sm">SIBM Connect</span>
            {syncing && <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin ml-1" />}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', color: 'white' }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>{profile.name.split(' ')[0]}</p>
              <span className="text-xs px-1.5 py-0.5 rounded font-bold ml-1"
                style={{
                  background: profile.year === 'Y1' ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)',
                  color: profile.year === 'Y1' ? '#34d399' : '#a78bfa',
                  fontSize: '9px'
                }}>{profile.year}</span>
            </button>

            <button onClick={() => setShowAdmin(true)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 transition-all active:scale-95"
              style={{ borderColor: 'rgba(99,102,241,0.5)', padding: 0 }} title="Admin">
              <img src="/admin.jpeg" alt="Admin" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
            <p className="text-xs" style={{ color: '#6b7280' }}>Synced {format(new Date(lastSyncTime), 'dd MMM, HH:mm')}</p>
            <button onClick={() => syncFromCloud()} className="text-xs ml-auto" style={{ color: '#6366f1' }}>Refresh</button>
          </div>
        )}

        {showAdmin ? (
          <AdminPanel onUpload={handleExcelUpload} onSyncSheets={syncFromSheets}
            loading={importLoading} syncStatus={syncStatus} report={importReport}
            onClose={() => { setShowAdmin(false); setView('dashboard'); }}
            lectures={lectures} onLecturesUpdate={(updated) => setLectures(updated)} />
        ) : (
          <>
            {view === 'dashboard' && <Dashboard profile={profile} lectures={lectures} />}
            {view === 'exams' && <ExamView profile={profile} />}
            {view === 'mess' && <MessMenuView />}
            {view === 'bus' && <BusTimingsView />}
          </>
        )}
      </div>

      {!showAdmin && <BottomNav current={view} onChange={handleViewChange} />}
      {showProfile && <ProfileEditor profile={profile} onSave={handleProfileUpdate} onClose={() => setShowProfile(false)} />}

      {introStage && (
        <div className={`welcome-overlay welcome-${introStage}`} aria-live="polite">
          <div className="welcome-watermark" />
          <div className="welcome-copy">
            {introStage === 'hello'
              ? <>Hello, {profile.name.trim().split(/\s+/)[0]}.</>
              : <>Welcome to <span>SIBM Connect.</span></>}
          </div>
        </div>
      )}

      <style>{`
        .welcome-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          align-items: center; justify-content: center; overflow: hidden;
          background: #080b14; color: #f7f7fa;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif;
          animation: welcomeFadeIn .55s ease both;
        }
        .welcome-watermark {
          position: absolute; inset: -24px;
          background-image: linear-gradient(rgba(8,11,20,.87), rgba(8,11,20,.91)), url('/admin.jpeg');
          background-size: cover; background-position: center 35%;
          filter: blur(3px) grayscale(25%); opacity: .22; transform: scale(1.04);
        }
        .welcome-copy {
          position: relative; z-index: 1; padding: 28px; text-align: center;
          font-size: clamp(30px, 7vw, 39px); line-height: 1.16;
          letter-spacing: -.045em; font-weight: 600;
          animation: welcomeTextIn .8s cubic-bezier(.2,.75,.25,1) both;
        }
        .welcome-copy span { font-weight: 700; }
        .welcome-exit { animation: welcomeFadeOut .85s ease forwards; }
        .welcome-exit .welcome-copy { animation: welcomeTextOut .7s ease forwards; }
        @keyframes welcomeFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes welcomeFadeOut { to { opacity: 0; visibility: hidden; } }
        @keyframes welcomeTextIn {
          from { opacity: 0; transform: translateY(13px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes welcomeTextOut { to { opacity: 0; transform: translateY(-8px); filter: blur(4px); } }
        @media (prefers-reduced-motion: reduce) {
          .welcome-overlay, .welcome-copy { animation-duration: .01ms !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
