import * as XLSX from 'xlsx';
import type { CampusInfo, ShuttleRoute } from '../types';

function clean(s: string): string {
  return String(s || '')
    .replace(/[🏠🚿🚪🍽️☕📍➤🚌🕐📝🏫🏙️]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function parseCampusInfoExcel(file: File): Promise<CampusInfo> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', raw: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const campusInfo: CampusInfo = {
    shuttles: [],
    mess: [],
    hostel: {},
    rules: [],
  };

  type Section =
    | 'none' | 'midnight' | 'hotwater' | 'latenight' | 'mess'
    | 'shuttle1_times' | 'shuttle1_route' | 'shuttle1_stops'
    | 'shuttle2_times' | 'shuttle2_stops'
    | 'rules';

  let section: Section = 'none';
  const shuttle1: ShuttleRoute = {
    name: 'LHT ↔ SUHRC', fromLabel: 'LHT', toLabel: 'SUHRC',
    toTimes: [], fromTimes: [], stops: [],
  };
  const shuttle2: ShuttleRoute = {
    name: 'Lavale ↔ S.B. Road', fromLabel: 'Lavale', toLabel: 'S.B. Road',
    toTimes: [], fromTimes: [], stops: [],
  };

  for (const row of rows) {
    const a = clean(String(row[0] ?? ''));
    const bRaw = String(row[1] ?? '').trim();
    const cRaw = String(row[2] ?? '').trim();
    const aUpper = a.toUpperCase();

    if (!a && !bRaw && !cRaw) continue;

    if (a && !bRaw && !cRaw) {
      if (aUpper.includes('MIDNIGHT')) { section = 'midnight'; continue; }
      if (aUpper.includes('HOT WATER')) { section = 'hotwater'; continue; }
      if (aUpper.includes('LATE NIGHT')) { section = 'latenight'; continue; }
      if (aUpper.includes('MESS')) { section = 'mess'; continue; }
      if (aUpper.includes('SHUTTLE') && aUpper.includes('SUHRC')) { section = 'shuttle1_times'; continue; }
      if (aUpper.includes('SHUTTLE') && (aUpper.includes('LAVALE') || aUpper.includes('S.B') || aUpper.includes('SB ROAD'))) { section = 'shuttle2_times'; continue; }
      if (aUpper.includes('BUS ROUTE')) { section = 'shuttle1_route'; continue; }
      if (aUpper.includes('DESIGNATED')) { section = 'shuttle1_stops'; continue; }
      if (aUpper.includes('DEPARTURE')) { section = 'shuttle2_times'; continue; }
      if (aUpper.includes('BUS STOPS')) {
        section = (section === 'shuttle1_route' || section === 'shuttle1_times' || section === 'shuttle1_stops')
          ? 'shuttle1_stops' : 'shuttle2_stops';
        continue;
      }
      if (aUpper.includes('RULES') || aUpper.includes('NOTES')) { section = 'rules'; continue; }
      if (aUpper.includes('HOSTEL TIMINGS')) { section = 'none'; continue; }
    }

    switch (section) {
      case 'midnight':
        if (a && bRaw) campusInfo.hostel.midnightCafe = bRaw;
        break;
      case 'hotwater':
        if (a.toLowerCase().includes('morning')) campusInfo.hostel.hotWaterMorning = bRaw;
        else if (a.toLowerCase().includes('evening')) campusInfo.hostel.hotWaterEvening = bRaw;
        break;
      case 'latenight':
        if (a.toLowerCase().includes('mon')) campusInfo.hostel.lateNightWeekday = bRaw;
        else if (a.toLowerCase().includes('sat')) campusInfo.hostel.lateNightWeekend = bRaw;
        else if (a.toLowerCase().includes('main gate')) campusInfo.hostel.mainGateClosed = bRaw;
        else if (a.toLowerCase().includes('hilltop')) campusInfo.hostel.hilltopGateExit = bRaw;
        break;
      case 'mess':
        if (a && bRaw) campusInfo.mess.push({ label: a, timing: bRaw });
        break;
      case 'shuttle1_times':
        if (a === '#') continue;
        if (/^\d+$/.test(a) && bRaw && cRaw) {
          shuttle1.toTimes.push({ departure: bRaw });
          shuttle1.fromTimes.push({ departure: cRaw });
        }
        break;
      case 'shuttle1_route':
        if (a) shuttle1.routeDescription = a;
        break;
      case 'shuttle1_stops':
        if (a) shuttle1.stops.push(a);
        break;
      case 'shuttle2_times':
        if (a === '#') continue;
        if (/^\d+$/.test(a) && bRaw && cRaw) {
          shuttle2.toTimes.push({ departure: bRaw });
          shuttle2.fromTimes.push({ departure: cRaw });
        }
        break;
      case 'shuttle2_stops':
        if (a === '#') continue;
        if (/^\d+$/.test(a) && bRaw) {
          shuttle2.stops.push(bRaw);
        }
        break;
      case 'rules':
        if (a && /^\d+\./.test(a)) {
          campusInfo.rules.push(a.replace(/^\d+\.\s*/, ''));
        }
        break;
    }
  }

  campusInfo.shuttles.push(shuttle1, shuttle2);
  return campusInfo;
}
