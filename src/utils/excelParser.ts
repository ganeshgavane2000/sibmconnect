import * as XLSX from 'xlsx';
import { parseAudience } from './audienceParser';
import { isFlatFormat, parseFlatExcelSheet } from './flatExcelParser';
import type { Lecture, ParseReport, LectureStatus } from '../types';

let idCounter = 0;
function genId() { return `lec_${Date.now()}_${idCounter++}`; }

function parseTimeRange(raw: string): { start: string; end: string } | null {
  if (!raw) return null;
  const clean = raw.toLowerCase().trim();
  const m = clean.match(/(\d{1,2}(?::\d{2})?)\s*(am|pm)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)/i);
  if (!m) return null;
  const toMins = (t: string, p: string) => {
    const [h, min = '0'] = t.split(':');
    let hh = parseInt(h);
    if (p === 'pm' && hh !== 12) hh += 12;
    if (p === 'am' && hh === 12) hh = 0;
    return hh * 60 + parseInt(min);
  };
  const fmt = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  return { start: fmt(toMins(m[1], m[2])), end: fmt(toMins(m[3], m[4])) };
}

function parseDateString(raw: string): string | null {
  const months: Record<string, string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  };
  // "29th June, 2026 (Mon) & Time" style
  const m = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)[,\s]+(\d{4})/);
  if (m) {
    const mon = months[m[2].toLowerCase().slice(0, 3)];
    if (mon) return `${m[3]}-${mon}-${String(m[1]).padStart(2, '0')}`;
  }
  // "30-06-2026" or "30/06/2026" (DD-MM-YYYY)
  const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
  }
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return null;
}

// Handle Excel's native Date object or serial number too
function parseAnyDate(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    // Use UTC getters — xlsx cellDates are constructed at UTC midnight
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return parseDateString(String(val).trim());
}

// Handle plain time string "09:15" or Excel time serial/Date object
function parseAnyTime(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) {
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  const s = String(val).trim();
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(':');
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return null;
}

function detectStatus(text: string): LectureStatus {
  const n = text.toLowerCase();
  if (n.includes('cancel') || n.includes('holiday')) return 'cancelled';
  if (n.includes('reschedul')) return 'rescheduled';
  return 'active';
}

/**
 * FORMAT A — "Block" format (the original SIBM weekly grid):
 *   Row: "Lecture Number"  | lec1 | lec2 | ...
 *   Row: "Date & Time"     | time | time | ...
 *   Row: "Course"          | name | name | ...
 *   Row: "Faculty Name"    | name | name | ...
 *   Row: "Class Room"      | room | room | ...
 *   Row: "Session/Combined"| aud  | aud  | ...
 */
function parseBlockFormat(rows: any[][]): { lectures: Lecture[]; warnings: string[]; skipped: number } {
  const lectures: Lecture[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  const blockStarts: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const cell = String(rows[i]?.[0] || '').toLowerCase().trim();
    if (cell.includes('lecture number') || cell.includes('lecture no')) blockStarts.push(i);
  }

  for (const startRow of blockStarts) {
    const dateRow    = rows[startRow + 1] || [];
    const courseRow  = rows[startRow + 2] || [];
    const facultyRow = rows[startRow + 3] || [];
    const roomRow    = rows[startRow + 4] || [];
    const audRow     = rows[startRow + 5] || [];

    const date = parseAnyDate(dateRow[0]) || '';

    const numCols = Math.max(dateRow.length, courseRow.length, facultyRow.length, roomRow.length, audRow.length);

    for (let col = 1; col < numCols; col++) {
      const timeRaw = String(dateRow[col] || '').trim();
      const subject = String(courseRow[col] || '').trim();
      const faculty = String(facultyRow[col] || '').trim();
      const room = String(roomRow[col] || '').trim();
      const rawAudience = String(audRow[col] || '').trim();

      if (!subject) { if (timeRaw || rawAudience) skipped++; continue; }

      const times = parseTimeRange(timeRaw);
      if (!times && timeRaw) warnings.push(`Could not parse time "${timeRaw}" for "${subject}"`);

      lectures.push({
        id: genId(), date,
        startTime: times?.start || '', endTime: times?.end || '',
        subject, faculty, room,
        rawAudience: rawAudience || 'All',
        audiences: parseAudience(rawAudience || 'All'),
        status: detectStatus(subject),
      });
    }
  }

  return { lectures, warnings, skipped };
}

/**
 * FORMAT B — "Columnar" format (one row per lecture):
 *   Header: Date | Start Time | End Time | Subject | Faculty | Room | Audience | Status
 */
function parseColumnarFormat(rows: any[][]): { lectures: Lecture[]; warnings: string[]; skipped: number } {
  const lectures: Lecture[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  if (rows.length === 0) return { lectures, warnings, skipped };

  const header = rows[0].map(h => String(h || '').toLowerCase().trim());
  const findCol = (...names: string[]) => header.findIndex(h => names.some(n => h.includes(n)));

  const dateCol = findCol('date');
  const startCol = findCol('start');
  const endCol = findCol('end');
  const subjectCol = findCol('subject', 'course');
  const facultyCol = findCol('faculty', 'professor', 'teacher');
  const roomCol = findCol('room', 'venue', 'hall');
  const audienceCol = findCol('audience', 'session', 'combined', 'division');
  const statusCol = findCol('status', 'remark');

  if (dateCol === -1 || subjectCol === -1) {
    return { lectures, warnings, skipped }; // not this format
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every(c => !c)) continue;

    const date = parseAnyDate(row[dateCol]) || '';
    const subject = String(row[subjectCol] || '').trim();

    if (!subject || !date) { skipped++; continue; }

    const startTime = startCol >= 0 ? (parseAnyTime(row[startCol]) || '') : '';
    const endTime = endCol >= 0 ? (parseAnyTime(row[endCol]) || '') : '';
    const faculty = facultyCol >= 0 ? String(row[facultyCol] || '').trim() : '';
    const room = roomCol >= 0 ? String(row[roomCol] || '').trim() : '';
    const rawAudience = audienceCol >= 0 ? String(row[audienceCol] || '').trim() : 'All';
    const statusText = statusCol >= 0 ? String(row[statusCol] || '').trim() : '';

    if (!startTime) warnings.push(`Missing/unparseable start time for "${subject}" on ${date}`);

    lectures.push({
      id: genId(), date, startTime, endTime,
      subject, faculty, room,
      rawAudience: rawAudience || 'All',
      audiences: parseAudience(rawAudience || 'All'),
      status: detectStatus(subject + ' ' + statusText),
    });
  }

  return { lectures, warnings, skipped };
}

export async function parseExcelFile(file: File): Promise<{ lectures: Lecture[]; report: ParseReport }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  let allLectures: Lecture[] = [];
  let allWarnings: string[] = [];
  let totalSkipped = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true }) as any[][];

    if (rows.length === 0) continue;

    // Detect format: 3-way — flat (one row per lecture), block (SIBM weekly grid), or columnar
    const hasBlockFormat = rows.some(r => {
      const c = String(r?.[0] || '').toLowerCase();
      return c.includes('lecture number') || c.includes('lecture no');
    });

    let result;
    if (!hasBlockFormat && isFlatFormat(rows[0])) {
      result = parseFlatExcelSheet(rows);
      allLectures = allLectures.concat(result.lectures);
      allWarnings = allWarnings.concat(result.report.warnings);
      totalSkipped += result.report.skipped;
      continue;
    }

    let blockResult;
    if (hasBlockFormat) {
      blockResult = parseBlockFormat(rows);
    } else {
      blockResult = parseColumnarFormat(rows);
    }

    allLectures = allLectures.concat(blockResult.lectures);
    allWarnings = allWarnings.concat(blockResult.warnings);
    totalSkipped += blockResult.skipped;
  }

  // Safety check: never silently wipe existing data with an empty parse
  if (allLectures.length === 0) {
    allWarnings.unshift(
      '⚠️ No lectures could be parsed from this file. Nothing was changed — your previous timetable is still active. Check the file format and try again.'
    );
  }

  return {
    lectures: allLectures,
    report: {
      total: allLectures.length + totalSkipped,
      imported: allLectures.length,
      skipped: totalSkipped,
      warnings: allWarnings,
    },
  };
}
