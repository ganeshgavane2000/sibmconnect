import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fetchMessMenuFromCloud } from '../store/supabase';
import type { WeeklyMenu, DayMenu } from '../utils/menuExtractor';

const MEAL_CONFIG = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅', color: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24' },
  { key: 'lunch', label: 'Lunch', icon: '☀️', color: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', text: '#a78bfa' },
  { key: 'eveningSnacks', label: 'Evening Snacks', icon: '🍵', color: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', text: '#fb923c' },
  { key: 'dinner', label: 'Dinner', icon: '🌙', color: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', text: '#34d399' },
] as const;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function MessMenuView() {
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [weekOf, setWeekOf] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  });

  useEffect(() => {
    fetchMessMenuFromCloud().then(({ menu: m, weekOf: w, updatedAt: u }) => {
      if (m && Object.keys(m).length > 0) setMenu(m as WeeklyMenu);
      setWeekOf(w);
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

  if (!menu) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-4xl mb-3">🍽️</p>
        <p className="font-semibold text-white">No menu this week</p>
        <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
          Admin hasn't uploaded the mess menu yet
        </p>
      </div>
    );
  }

  const dayMenu: DayMenu | undefined = menu[selectedDay];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Mess Menu</h2>
        <div className="flex items-center gap-2 mt-0.5">
          {weekOf && (
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Week of {format(parseISO(weekOf), 'd MMM yyyy')}
            </p>
          )}
          {updatedAt && (
            <p className="text-xs" style={{ color: '#6b7280' }}>
              · Updated {format(new Date(updatedAt), 'dd MMM')}
            </p>
          )}
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {DAYS.map(day => {
          const isToday = day === DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
          const hasMenu = !!menu[day];
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              disabled={!hasMenu}
              className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: selectedDay === day
                  ? 'linear-gradient(135deg, #6366f1, #a78bfa)'
                  : isToday
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(255,255,255,0.05)',
                color: selectedDay === day ? 'white' : isToday ? '#a78bfa' : hasMenu ? '#9ca3af' : '#4b5563',
                border: isToday && selectedDay !== day ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}
            >
              {day.slice(0, 3)}
              {isToday && <span className="block text-[9px] mt-0.5 opacity-70">Today</span>}
            </button>
          );
        })}
      </div>

      {/* Meals for selected day */}
      {dayMenu ? (
        <div className="space-y-3">
          {MEAL_CONFIG.map(({ key, label, icon, color, border, text }) => {
            const items = dayMenu[key] || [];
            const isEmpty = items.length === 0 || (items.length === 1 && items[0] === 'N/A');
            return (
              <div key={key} className="rounded-2xl p-4"
                style={{ background: color, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{icon}</span>
                  <p className="text-sm font-semibold" style={{ color: text }}>{label}</p>
                </div>
                {isEmpty ? (
                  <p className="text-xs" style={{ color: '#6b7280' }}>Not available</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: 'rgba(255,255,255,0.07)', color: '#e5e7eb' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-white">No menu for {selectedDay}</p>
        </div>
      )}
    </div>
  );
}
