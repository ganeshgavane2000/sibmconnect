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

type IntroStage = 'hello' | 'brand' | 'exit';

// Start loading the intro font as early as possible
if (typeof document !== 'undefined' && !document.getElementById('sibm-intro-fonts')) {
  const l = document.createElement('link');
  l.id = 'sibm-intro-fonts';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@500;600;700;800&display=swap';
  document.head.appendChild(l);
}

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

    let cancelled = false;
    const timers: number[] = [];

    const start = () => {
      if (cancelled) return;
      setIntroStage('hello');
      timers.push(window.setTimeout(() => setIntroStage('brand'), 1350));
      timers.push(window.setTimeout(() => setIntroStage('exit'), 2350));
      timers.push(window.setTimeout(() => setIntroStage(null), 3000));
    };

    // Wait briefly for the script font so the intro never flashes a fallback font
    const fontReady: Promise<unknown> = document.fonts && document.fonts.load
      ? Promise.race([
          document.fonts.load('64px "Great Vibes"'),
          new Promise(resolve => window.setTimeout(resolve, 700)),
        ])
      : Promise.resolve();
    fontReady.then(start, start);

    return () => {
      cancelled = true;
      timers.forEach(t => window.clearTimeout(t));
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

  const firstName = profile.name.trim().split(/\s+/)[0];

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
        <div className={`intro is-${introStage}`} onClick={() => setIntroStage(null)} aria-live="polite">
          <div className="intro-orb intro-orb-a" />
          <div className="intro-orb intro-orb-b" />

          <div className="intro-stage intro-hello">
            <div className="intro-script">Hello</div>
            <div className="intro-name">{firstName}</div>
          </div>

          <div className="intro-stage intro-brand">
            <div className="intro-mark">S</div>
            <div className="intro-welcome">Welcome to</div>
            <div className="intro-title">SIBM Connect</div>
            <div className="intro-copy">
              Copyright © 2025-2027<br />
              Developed by Ganesh Gavane. All rights reserved.
            </div>
          </div>
        </div>
      )}

      <style>{`
        .intro {
          position: fixed; inset: 0; z-index: 100; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: #05070d; color: #f5f5f7; cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif;
          -webkit-tap-highlight-color: transparent;
          animation: introIn .35s ease both;
        }
        .intro-orb { position: absolute; border-radius: 50%; filter: blur(64px); opacity: 0; animation: introOrb 2.6s ease-out forwards; }
        .intro-orb-a { width: 340px; height: 340px; background: #6366f1; top: 10%; left: -10%; }
        .intro-orb-b { width: 300px; height: 300px; background: #a78bfa; bottom: 8%; right: -12%; animation-delay: .15s; }

        .intro-stage {
          position: absolute; inset: 0; padding: 24px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          transition: opacity .55s cubic-bezier(.4,0,.2,1), transform .75s cubic-bezier(.2,.8,.2,1), filter .55s ease;
        }

        /* Stage 1: handwritten Hello + name */
        .intro-script {
          font-family: 'Great Vibes', 'Snell Roundhand', 'Apple Chancery', cursive;
          font-size: clamp(76px, 22vw, 112px); line-height: 1.1; padding: .1em .15em;
          background: linear-gradient(100deg, #ffffff 15%, #c4b5fd 55%, #818cf8 92%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          filter: drop-shadow(0 6px 30px rgba(129,140,248,.45));
          clip-path: inset(-20% 100% -20% -5%);
          animation: introWrite 1.05s cubic-bezier(.65,0,.25,1) .12s forwards;
        }
        .intro-name {
          margin-top: 2px; font-size: clamp(30px, 8.5vw, 40px); font-weight: 600; letter-spacing: -.035em;
          opacity: 0; transform: translateY(12px); filter: blur(6px);
          animation: introRise .7s cubic-bezier(.2,.8,.2,1) .8s forwards;
        }

        /* Stage 2: logo + Welcome to SIBM Connect + copyright */
        .intro-mark {
          width: 72px; height: 72px; border-radius: 20px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; font-weight: 800; color: #fff;
          background: linear-gradient(135deg, #6366f1, #a78bfa);
          box-shadow: 0 18px 50px rgba(99,102,241,.45), inset 0 1px 0 rgba(255,255,255,.35);
        }
        .intro-welcome {
          font-size: clamp(22px, 6vw, 28px); font-weight: 500;
          letter-spacing: -.02em; color: #c7c9d1; margin-bottom: 6px;
        }
        .intro-title {
          font-size: clamp(40px, 11vw, 54px); font-weight: 800; letter-spacing: -.045em; line-height: 1.1;
          background: linear-gradient(100deg, #ffffff 20%, #c4b5fd 60%, #818cf8);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
        }
        .intro-copy {
          position: absolute; left: 0; right: 0;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 28px);
          padding: 0 24px; font-size: 11px; line-height: 1.6;
          letter-spacing: .04em; color: #6b7280; font-weight: 500;
        }

        /* Stage choreography */
        .is-hello .intro-brand { opacity: 0; transform: scale(.92); filter: blur(10px); }
        .is-brand .intro-hello, .is-exit .intro-hello { opacity: 0; transform: translateY(-14px) scale(1.05); filter: blur(8px); }
        .is-brand .intro-brand { opacity: 1; transform: scale(1); filter: blur(0); }
        .is-exit .intro-brand { opacity: 0; transform: scale(1.14); filter: blur(6px); }
        .is-exit { animation: introOut .6s ease forwards; }

        @keyframes introIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes introOut { to { opacity: 0; visibility: hidden; } }
        @keyframes introOrb { 0% { opacity: 0; transform: translateY(20px); } 40% { opacity: .35; } 100% { opacity: .2; transform: translateY(-10px); } }
        @keyframes introWrite { to { clip-path: inset(-20% -5% -20% -5%); } }
        @keyframes introRise { to { opacity: 1; transform: none; filter: blur(0); } }

        @media (prefers-reduced-motion: reduce) {
          .intro, .intro-orb { animation-duration: .01ms !important; }
          .intro-script { animation: none; clip-path: none; }
          .intro-name { animation: none; opacity: 1; transform: none; filter: none; }
          .intro-stage { transition-duration: .01ms; }
        }
      `}</style>
    </div>
  );
}

export default App;
