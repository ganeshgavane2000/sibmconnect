import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { extractMenuFromPhoto } from '../utils/menuExtractor';
import { parseMessMenuExcel } from '../utils/messMenuExcelParser';
import { pushMessMenuToCloud } from '../store/supabase';
import type { WeeklyMenu } from '../utils/menuExtractor';

export function MessMenuUpload() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'reading' | 'saving' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [mode, setMode] = useState<'photo' | 'excel'>('excel');
  const photoRef = useRef<HTMLInputElement>(null);
  const excelRef = useRef<HTMLInputElement>(null);

  const processMenu = async (menu: WeeklyMenu) => {
    let count = 0;
    Object.values(menu).forEach(day =>
      Object.values(day).forEach(meals => { count += (meals as string[]).length; })
    );
    setItemCount(count);

    setStatus('saving');
    const weekOf = format(new Date(), 'yyyy-MM-dd');
    const ok = await pushMessMenuToCloud(menu, weekOf);
    if (!ok) throw new Error('Failed to save to cloud');
    setStatus('done');
  };

  const handlePhoto = async (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    setError('');
    setStatus('reading');
    try {
      const menu = await extractMenuFromPhoto(file);
      await processMenu(menu);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleExcel = async (file: File) => {
    setLoading(true);
    setError('');
    setStatus('reading');
    setPreview(null);
    try {
      const menu = await parseMessMenuExcel(file);
      await processMenu(menu);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStatus('idle'); setError(''); setPreview(null); };

  return (
    <div className="rounded-3xl p-5 space-y-3"
      style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>

      <div>
        <p className="font-semibold text-white text-sm">🍽️ Mess Menu Upload</p>
        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
          Upload the weekly mess menu — students see it instantly in the Mess tab.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['excel', 'photo'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: mode === m ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
              border: mode === m ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: mode === m ? '#fbbf24' : '#6b7280',
            }}>
            {m === 'excel' ? '📊 Excel File' : '📷 Photo'}
          </button>
        ))}
      </div>

      {/* Upload area */}
      {status === 'done' ? (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <p className="text-2xl mb-2">✅</p>
          <p className="font-semibold text-white text-sm">Menu uploaded!</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
            {itemCount} items · All students can see this week's menu
          </p>
          <button onClick={reset} className="text-xs mt-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
            Upload new menu
          </button>
        </div>
      ) : loading ? (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {preview && <img src={preview} className="w-full max-h-32 object-cover rounded-xl mb-3" />}
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium" style={{ color: '#fbbf24' }}>
              {status === 'reading'
                ? mode === 'photo' ? '🤖 AI reading menu photo...' : '📊 Parsing Excel...'
                : '☁️ Saving to cloud...'}
            </p>
          </div>
        </div>
      ) : mode === 'excel' ? (
        <div
          className="rounded-2xl p-6 text-center cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(251,191,36,0.25)' }}
          onClick={() => excelRef.current?.click()}
        >
          <input ref={excelRef} type="file" accept=".xlsx,.xls,.xlsm" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleExcel(f); e.target.value = ''; }} />
          <p className="text-2xl mb-2">📊</p>
          <p className="font-medium text-white text-sm">Tap to upload Excel menu</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>.xlsx · .xls</p>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 text-center cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(251,191,36,0.25)' }}
          onClick={() => photoRef.current?.click()}
        >
          <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ''; }} />
          <p className="text-2xl mb-2">📷</p>
          <p className="font-medium text-white text-sm">Tap to upload menu photo</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Camera or gallery · JPG/PNG</p>
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
