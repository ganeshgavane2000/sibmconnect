import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    now,
    timeStr: format(now, 'HH:mm'),
    dateStr: format(now, 'yyyy-MM-dd'),
    displayDate: format(now, 'EEEE, d MMMM'),
  };
}
