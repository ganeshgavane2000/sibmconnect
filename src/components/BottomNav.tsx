import type { AppView } from '../hooks/useApp';

interface Props {
  current: AppView;
  onChange: (view: AppView) => void;
}

const NAV_ITEMS: { view: AppView; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '⚡', label: 'Home' },
  { view: 'today', icon: '📅', label: 'Today' },
  { view: 'week', icon: '🗓️', label: 'Week' },
  { view: 'mess', icon: '🍽️', label: 'Mess' },
  { view: 'bus', icon: '🚌', label: 'Bus' },
];

export function BottomNav({ current, onChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-6 pt-2"
      style={{ background: 'linear-gradient(to top, rgba(8,11,20,1) 60%, transparent)' }}>
      <div className="max-w-sm mx-auto">
        <div className="glass-strong rounded-2xl p-1 flex gap-0.5"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {NAV_ITEMS.map(({ view, icon, label }) => (
            <button
              key={view}
              onClick={() => onChange(view)}
              className="flex-1 flex flex-col items-center py-2 rounded-xl transition-all duration-200"
              style={{
                background: current === view
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(167,139,250,0.25))'
                  : 'transparent',
              }}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="text-[10px] mt-0.5 font-medium"
                style={{ color: current === view ? '#a78bfa' : '#6b7280' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
