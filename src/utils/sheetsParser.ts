import { parseAudience } from './audienceParser';
import type { Lecture, ParseReport } from '../types';

const EDGE_FUNCTION_URL = 'https://pnqrksjddknvwsvbodvg.supabase.co/functions/v1/fetch-sheet';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucXJrc2pkZGtudndzdmJvZHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjExMzUsImV4cCI6MjA5ODIzNzEzNX0.wSUh7422TFXr3ej1uLySc9OKmUIJFYBjbhvmIQ8osNM';

let idCounter = 0;
function genId() { return `gs_${Date.now()}_${idCounter++}`; }

function parseTimeRange(raw: string): { start: string; end: string } | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  const match = clean.match(
    /(\d{1,2}(?::\d{2})?)\s*(am|pm)\s*(?:to|-|–)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)/i
  );
  if (!match) return null;
  const toMins = (t: string, p: string) => {
    const [h, m = '0'] = t.split(':');
    let hh = parseInt(h);
    if (p === 'pm' && hh !== 12) hh += 12;
    if (p === 'am' && hh === 12) hh = 0;
    return hh * 60 + parseInt(m);
  };
  const fmt = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  return { start: fmt(toMins(match[1], match[2])), end: fmt(toMins(match[3], match[4])) };
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const months: Record<string, string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  };
  const m = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)[,\s]+(\d{4})/);
  if (m) {
    const mon = months[m[2].toLowerCase().slice(0, 3)];
    if (mon) return `${m[3]}-${mon}-${String(m[1]).padStart(2, '0')}`;
  }
  return null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export async function fetchAndParseGoogleSheet(): Promise<{ lectures: Lecture[]; report: ParseReport }> {
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Edge function returned ${res.status}: ${text.slice(0, 100)}`);
  }

  const csvText = await res.text();
  if (!csvText || csvText.length < 10) {
    throw new Error('Empty response from Google Sheets');
  }

  return parseSheetCsv(csvText);
}

export function parseSheetCsv(csvText: string): { lectures: Lecture[]; report: ParseReport } {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  const rows: string[][] = lines.map(parseCsvLine);

  const lectures: Lecture[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  // Find all "Lecture Number" header rows
  const blockStartRows: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const firstCell = (rows[i][0] || '').toLowerCase().trim();
    if (firstCell.includes('lecture number') || firstCell.includes('lecture no')) {
      blockStartRows.push(i);
    }
  }

  for (let b = 0; b < blockStartRows.length; b++) {
    const startRow = blockStartRows[b];
    const endRow = b + 1 < blockStartRows.length ? blockStartRows[b + 1] : rows.length;

    let dateTimeRow: string[] | null = null;
    let courseRow: string[] | null = null;
    let facultyRow: string[] | null = null;
    let roomRow: string[] | null = null;
    let audienceRow: string[] | null = null;

    for (let r = startRow; r < endRow; r++) {
      const label = (rows[r][0] || '').toLowerCase().trim();
      if (!rows[r] || rows[r].every(c => !c)) continue;

      if (label.includes('date') || label.includes('time')) {
        dateTimeRow = rows[r];
      } else if (label.includes('course') || label.includes('subject')) {
        courseRow = rows[r];
      } else if (label.includes('faculty') || label.includes('professor') || label.includes('teacher')) {
        facultyRow = rows[r];
      } else if (label.includes('room') || label.includes('class room') || label.includes('venue')) {
        roomRow = rows[r];
      } else if (label.includes('session') || label.includes('combined') || label.includes('audience') || label.includes('division')) {
        audienceRow = rows[r];
      }
    }

    if (!courseRow) continue;

    let date = '';
    if (dateTimeRow) date = parseDate(dateTimeRow[0] || '') || '';

    const numCols = Math.max(
      dateTimeRow?.length || 0,
      courseRow?.length || 0,
      facultyRow?.length || 0,
    );

    for (let col = 1; col < numCols; col++) {
      const timeRaw = dateTimeRow?.[col] || '';
      const subject = courseRow?.[col] || '';
      const faculty = facultyRow?.[col] || '';
      const room = roomRow?.[col] || '';
      const rawAudience = audienceRow?.[col] || '';

      if (!subject && !timeRaw) continue;
      if (!subject) { skipped++; continue; }

      const times = parseTimeRange(timeRaw);
      if (!times && timeRaw) warnings.push(`Could not parse time "${timeRaw}" for "${subject}"`);

      const isCancelled = subject.toLowerCase().includes('cancel') ||
        rawAudience.toLowerCase().includes('cancel');

      lectures.push({
        id: genId(),
        date,
        startTime: times?.start || '',
        endTime: times?.end || '',
        subject: subject.trim(),
        faculty: faculty.trim(),
        room: room.trim(),
        rawAudience: rawAudience.trim() || 'All',
        audiences: parseAudience(rawAudience.trim() || 'All'),
        status: isCancelled ? 'cancelled' : 'active',
      });
    }
  }

  return {
    lectures,
    report: { total: lectures.length + skipped, imported: lectures.length, skipped, warnings },
  };
}
