import * as XLSX from 'xlsx';
import { parseAudience } from './audienceParser';
import type { Lecture, ParseReport, LectureStatus } from '../types';

let idCounter = 0;
function genId() { return `flat_${Date.now()}_${idCounter++}`; }

// Handles: Excel date serial number, Date object, or text like "30-06-2026"
function normalizeDate(raw: any): string | null {
  if (raw === null || raw === undefined || raw === '') return null;

  if (raw instanceof Date) {
    // xlsx with cellDates:true constructs dates at UTC midnight.
    // Reading with local getters (getFullYear/getDate) can shift the day
    // depending on the browser/server timezone. Always read UTC components.
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const d = String(raw.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof raw === 'number') {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }

  const s = String(raw).trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
  }

  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  return null;
}

// Handles: Excel time fraction (number), Date/time object, or text "09:15"
function normalizeTime(raw: any): string {
  if (raw === null || raw === undefined || raw === '') return '';

  if (raw instanceof Date) {
    return `${String(raw.getUTCHours()).padStart(2, '0')}:${String(raw.getUTCMinutes()).padStart(2, '0')}`;
  }

  if (typeof raw === 'number') {
    const totalMins = Math.round(raw * 24 * 60);
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const s = String(raw).trim();
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(':');
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // "9:15 am" / "9:15 AM"
  const ampm = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    if (ampm[3].toLowerCase() === 'pm' && h !== 12) h += 12;
    if (ampm[3].toLowerCase() === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${ampm[2]}`;
  }

  return '';
}

function detectStatus(statusRaw: string, subject: string): LectureStatus {
  const n = (statusRaw + ' ' + subject).toLowerCase();
  if (n.includes('cancel')) return 'cancelled';
  if (n.includes('reschedul')) return 'rescheduled';
  return 'active';
}

/**
 * Detects whether an Excel file is in "flat" format:
 * One header row: Date | Start Time | End Time | Subject | Faculty | Room | Audience | Status
 * One row per lecture (one audience per row — duplicate rows for combined classes)
 */
export function isFlatFormat(headerRow: any[]): boolean {
  const headers = headerRow.map(h => String(h || '').toLowerCase().trim());
  const hasDate = headers.some(h => h === 'date');
  const hasStart = headers.some(h => h.includes('start'));
  const hasSubject = headers.some(h => h.includes('subject'));
  const hasAudience = headers.some(h => h.includes('audience'));
  return hasDate && hasStart && hasSubject && hasAudience;
}

export function parseFlatExcelSheet(rows: any[][]): { lectures: Lecture[]; report: ParseReport } {
  const lectures: Lecture[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  if (rows.length === 0) {
    return { lectures, report: { total: 0, imported: 0, skipped: 0, warnings: ['Empty sheet'] } };
  }

  const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
  const col = (patterns: string[]): number => {
    for (const p of patterns) {
      const idx = headers.findIndex(h => h.includes(p));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateCol = col(['date']);
  const startCol = col(['start']);
  const endCol = col(['end']);
  const subjectCol = col(['subject', 'course']);
  const facultyCol = col(['faculty', 'professor', 'teacher']);
  const roomCol = col(['room', 'venue', 'hall']);
  const audienceCol = col(['audience', 'session', 'combined']);
  const statusCol = col(['status', 'remark']);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every(c => c === null || c === undefined || c === '')) continue;

    const subject = String(row[subjectCol] ?? '').trim();
    const rawDate = row[dateCol];
    const date = normalizeDate(rawDate) || '';

    if (!subject) {
      // Skip rows with no subject — likely trailing blank/leftover date-only rows
      continue;
    }

    const startTime = normalizeTime(row[startCol]);
    const endTime = normalizeTime(row[endCol]);
    const faculty = String(row[facultyCol] ?? '').trim();
    const room = String(row[roomCol] ?? '').trim();
    const rawAudience = String(row[audienceCol] ?? '').trim() || 'All';
    const statusRaw = statusCol !== -1 ? String(row[statusCol] ?? '').trim() : '';

    if (!date) {
      warnings.push(`Skipped "${subject}" — could not parse date "${rawDate}"`);
      skipped++;
      continue;
    }
    if (!startTime) {
      warnings.push(`Could not parse start time for "${subject}" on ${date}`);
    }

    lectures.push({
      id: genId(),
      date,
      startTime,
      endTime,
      subject,
      faculty,
      room,
      rawAudience,
      audiences: parseAudience(rawAudience),
      status: detectStatus(statusRaw, subject),
    });
  }

  return {
    lectures,
    report: {
      total: lectures.length + skipped,
      imported: lectures.length,
      skipped,
      warnings,
    },
  };
}
