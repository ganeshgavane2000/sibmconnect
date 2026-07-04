import { useEffect, useState } from 'react';
import { fetchCampusInfoFromCloud } from '../store/supabase';
import type { CampusInfo, ShuttleRoute } from '../types';
import { format } from 'date-fns';

function ShuttleCard({ shuttle }: { shuttle: ShuttleRoute }) {
  const [tab, setTab] = useState<'to' | 'from'>('to');
  const times = tab === 'to' ? shuttle.toTimes : shuttle.fromTimes;
  const label = tab === 'to' ? `${shuttle.fromLabel} → ${shuttle.toLabel}` : `${shuttle.toLabel} → ${shuttle.fromLabel}`;

  return (
    <div className="glass rounded-3xl p-5 space-y-4">
      <div>
        <p className="font-bold text-white text-base">🚌 {shuttle.name}</p>
      </div>

      {/* Direction toggle */}
      <div className="flex gap-2">
        <button onClick={() => setTab('to')}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: tab === 'to' ? 'linear-gradient(135deg, #6366f1, #a78bfa)' : 'rgba(255,255,255,0.05)',
            color: tab === 'to' ? 'white' : '#9ca3af',
          }}>
          {shuttle.fromLabel} → {shuttle.toLabel}
        </button>
        <button onClick={() => setTab('from')}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: tab === 'from' ? 'linear-gradient(135deg, #6366f1, #a78bfa)' : 'rgba(255,255,255,0.05)',
            color: tab === 'from' ? 'white' : '#9ca3af',
          }}>
          {shuttle.toLabel} → {shuttle.fromLabel}
        </button>
      </div>

      {/* Times grid */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>{label} — Departure Times</p>
        <div className="grid grid-cols-3 gap-2">
          {times.map((t, i) => (
            <div key={i} className="rounded-xl py-2 text-center"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="text-xs font-bold text-white">{t.departure}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Route description */}
      {shuttle.routeDescription && (
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: '#6b7280' }}>Route</p>
          <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{shuttle.routeDescription}</p>
        </div>
      )}

      {/* Stops */}
      {shuttle.stops.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>Designated Stops</p>
          <div className="space-y-1.5">
            {shuttle.stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#d1d5db' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                  {i + 1}
                </span>
                {stop}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BusTimingsView() {
  const [info, setInfo] = useState<CampusInfo | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampusInfoFromCloud().then(({ info: i, updatedAt: u }) => {
      if (i && Object.keys(i).length > 0) setInfo(i as CampusInfo);
      setUpdatedAt(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!info || info.shuttles.length === 0) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-4xl mb-3">🚌</p>
        <p className="font-semibold text-white">No campus info yet</p>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Admin hasn't uploaded bus timings yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Bus & Campus Info</h2>
        {updatedAt && (
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Updated {format(new Date(updatedAt), 'dd MMM yyyy')}
          </p>
        )}
      </div>

      {/* Shuttle cards */}
      {info.shuttles.map((s, i) => <ShuttleCard key={i} shuttle={s} />)}

      {/* Hostel timings */}
      <div className="glass rounded-3xl p-5 space-y-3">
        <p className="font-bold text-white text-base">🏠 Hostel Timings</p>

        <div className="space-y-2">
          {info.hostel.midnightCafe && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>☕ Midnight Café</span>
              <span className="text-xs font-semibold text-white">{info.hostel.midnightCafe}</span>
            </div>
          )}
          {info.hostel.hotWaterMorning && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>🚿 Hot Water (Morning)</span>
              <span className="text-xs font-semibold text-white">{info.hostel.hotWaterMorning}</span>
            </div>
          )}
          {info.hostel.hotWaterEvening && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>🚿 Hot Water (Evening)</span>
              <span className="text-xs font-semibold text-white">{info.hostel.hotWaterEvening}</span>
            </div>
          )}
          {info.hostel.lateNightWeekday && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>🚪 Late Night Entry (Mon-Fri)</span>
              <span className="text-xs font-semibold text-white">{info.hostel.lateNightWeekday}</span>
            </div>
          )}
          {info.hostel.lateNightWeekend && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>🚪 Late Night Entry (Sat-Sun)</span>
              <span className="text-xs font-semibold text-white">{info.hostel.lateNightWeekend}</span>
            </div>
          )}
          {info.hostel.mainGateClosed && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>🔒 Main Gate Closed</span>
              <span className="text-xs font-semibold" style={{ color: '#f87171' }}>{info.hostel.mainGateClosed}</span>
            </div>
          )}
          {info.hostel.hilltopGateExit && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>🚪 Hilltop Gate Exit</span>
              <span className="text-xs font-semibold text-white">{info.hostel.hilltopGateExit}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mess timings */}
      {info.mess.length > 0 && (
        <div className="glass rounded-3xl p-5 space-y-2">
          <p className="font-bold text-white text-base mb-1">🍽️ Mess Timings</p>
          {info.mess.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>{m.label}</span>
              <span className="text-xs font-semibold text-white">{m.timing}</span>
            </div>
          ))}
        </div>
      )}

      {/* Rules */}
      {info.rules.length > 0 && (
        <div className="rounded-3xl p-5 space-y-2"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <p className="font-bold text-sm" style={{ color: '#fbbf24' }}>📝 Rules & Notes</p>
          {info.rules.map((r, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: '#d1d5db' }}>• {r}</p>
          ))}
        </div>
      )}
    </div>
  );
}
