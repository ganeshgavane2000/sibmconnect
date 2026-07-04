import { useRef, useState } from 'react';
import { parseCampusInfoExcel } from '../utils/campusInfoParser';
import { pushCampusInfoToCloud } from '../store/supabase';

export function CampusInfoUpload() {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ shuttles: number; stops: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|xlsm)$/i)) {
      setError('Please upload an Excel file (.xlsx, .xls)');
      return;
    }
    setError('');
    setStatus('parsing');

    try {
      const info = await parseCampusInfoExcel(file);

      const totalStops = info.shuttles.reduce((sum, s) => sum + s.stops.length, 0);
      setStats({ shuttles: info.shuttles.length, stops: totalStops });

      setStatus('saving');
      const ok = await pushCampusInfoToCloud(info);
      if (!ok) throw new Error('Failed to save to cloud');

      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const reset = () => { setStatus('idle'); setError(''); setStats(null); };

  return (
    <div className="rounded-3xl p-5 space-y-3"
      style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>

      <div>
        <p className="font-semibold text-white text-sm">🚌 Bus Timings & Campus Info</p>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
          Upload the shuttle bus / hostel timings Excel — students see it instantly in the Bus tab.
        </p>
      </div>

      {status === 'done' ? (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <p className="text-2xl mb-2">✅</p>
          <p className="font-semibold text-white text-sm">Campus info updated!</p>
          {stats && (
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
              {stats.shuttles} shuttle routes · {stats.stops} stops mapped
            </p>
          )}
          <button onClick={reset} className="text-xs mt-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
            Upload new file
          </button>
        </div>
      ) : status === 'parsing' || status === 'saving' ? (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium" style={{ color: '#a78bfa' }}>
              {status === 'parsing' ? 'Reading Excel file...' : 'Saving to cloud...'}
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 text-center cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(99,102,241,0.25)' }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.xlsm" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <p className="text-2xl mb-2">📊</p>
          <p className="font-medium text-white text-sm">Tap to upload campus info Excel</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>.xlsx · .xls</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs text-red-400 font-medium">❌ {error}</p>
          <button onClick={reset} className="text-xs mt-1.5 underline" style={{ color: '#9ca3af' }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
