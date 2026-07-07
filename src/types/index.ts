export type Specialization = 'Marketing A' | 'Marketing B' | 'Finance' | 'HR' | 'Operations';
export type Minor = 'Marketing' | 'Finance' | 'HR' | 'Data Analytics' | 'None';

export interface StudentProfile {
  name: string;
  rollNumber: string;
  specialization: Specialization;
  minor: Minor;
}

export type LectureStatus = 'active' | 'cancelled' | 'rescheduled';

export interface Lecture {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  faculty: string;
  room: string;
  rawAudience: string;
  audiences: NormalizedAudience[];
  status: LectureStatus;
  cancellationReason?: string;
}

export interface NormalizedAudience {
  specialization: Specialization | 'All';
  minor?: Minor;
}

export interface ParseReport {
  total: number;
  imported: number;
  skipped: number;
  warnings: string[];
}

export interface ShuttleTime {
  departure: string;
  arrival?: string;
}

export interface ShuttleRoute {
  name: string;
  fromLabel: string;
  toLabel: string;
  toTimes: ShuttleTime[];
  fromTimes: ShuttleTime[];
  stops: string[];
  routeDescription?: string;
}

export interface CampusTimingItem {
  label: string;
  timing: string;
}

export interface CampusInfo {
  shuttles: ShuttleRoute[];
  mess: CampusTimingItem[];
  hostel: {
    midnightCafe?: string;
    hotWaterMorning?: string;
    hotWaterEvening?: string;
    lateNightWeekday?: string;
    lateNightWeekend?: string;
    mainGateClosed?: string;
    hilltopGateExit?: string;
  };
  rules: string[];
}
