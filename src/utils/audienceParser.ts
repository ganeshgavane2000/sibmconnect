import type { NormalizedAudience, Specialization, Minor } from '../types';

const ALL_SPECS: Specialization[] = ['Marketing A', 'Marketing B', 'Finance', 'HR', 'Operations'];

// Fix common typos found in the actual SIBM timetable Excel
const TYPO_FIXES: [RegExp, string][] = [
  [/finanace/gi,   'finance'],
  [/opeartions/gi, 'operations'],
  [/operartions/gi,'operations'],
  [/maketing/gi,   'marketing'],
  [/marketting/gi, 'marketing'],
];

function normalize(raw: string): string {
  let s = raw;
  for (const [pat, fix] of TYPO_FIXES) s = s.replace(pat, fix);
  return s.toLowerCase().replace(/[&+]/g, ' and ').replace(/\s+/g, ' ').trim();
}

function detectSpecs(t: string): Specialization[] {
  const found: Specialization[] = [];

  // Marketing A+B together
  if (
    (t.includes('marketing a') && t.includes('marketing b')) ||
    t.match(/marketing\s+a\s*and\s*b/) ||
    t.match(/marketing\s+a\s*,\s*b/)
  ) {
    found.push('Marketing A', 'Marketing B');
  } else if (t.match(/\bmarketing\s+a\b/)) {
    found.push('Marketing A');
  } else if (t.match(/\bmarketing\s+b\b/)) {
    found.push('Marketing B');
  } else if (t.includes('marketing') && !t.includes('minor marketing')) {
    found.push('Marketing A', 'Marketing B');
  }

  if (t.match(/\bfin(ance)?\s*[a-d]?\b/) && !found.includes('Finance'))
    found.push('Finance');

  if ((t.match(/\bhr\s*[a-d]?\b/) || t.includes('human resource')) && !found.includes('HR'))
    found.push('HR');

  if (t.match(/\b(operations?|ops)\s*[a-d]?\b/) && !found.includes('Operations'))
    found.push('Operations');

  return found;
}

export function parseAudience(raw: string): NormalizedAudience[] {
  if (!raw || !raw.trim()) return [{ specialization: 'All' }];

  const t = normalize(raw);

  // All students
  if (
    t.includes('all divisions') || t.includes('all sections') ||
    t === 'all' || t.includes('entire batch')
  ) {
    return [{ specialization: 'All' }];
  }

  // Minor DA groups: "Minor DA - Group 1 - Marketing A and Ops C"
  if (t.includes('minor da') || (t.includes('minor') && t.includes('data analytics'))) {
    const minor: Minor = 'Data Analytics';
    const stripped = t.replace(/minor\s+(da|data analytics)[\s-]*(group\s*\d+[\s-]*)?/gi, '');
    const specs = detectSpecs(stripped);
    return specs.length > 0
      ? specs.map(s => ({ specialization: s, minor }))
      : ALL_SPECS.map(s => ({ specialization: s, minor }));
  }

  // Minor Finance
  if (t.match(/\bminor\s+fin(ance)?\b/)) {
    const minor: Minor = 'Finance';
    const stripped = t.replace(/minor\s+fin(ance)?/gi, '');
    const specs = detectSpecs(stripped);
    return specs.length > 0
      ? specs.map(s => ({ specialization: s, minor }))
      : ALL_SPECS.map(s => ({ specialization: s, minor }));
  }

  // Minor HR
  if (t.match(/\bminor\s+hr\b/)) {
    const minor: Minor = 'HR';
    const stripped = t.replace(/minor\s+hr/gi, '');
    const specs = detectSpecs(stripped);
    return specs.length > 0
      ? specs.map(s => ({ specialization: s, minor }))
      : ALL_SPECS.map(s => ({ specialization: s, minor }));
  }

  // Minor Marketing
  if (t.match(/\bminor\s+marketing\b/)) {
    const minor: Minor = 'Marketing';
    return ALL_SPECS.map(s => ({ specialization: s, minor }));
  }

  // Combined / regular — strip prefix, parse specs
  const stripped = t
    .replace(/^combined\s*[-–]\s*/i, '')
    .replace(/^lecture\s+for\s+/i, '');

  const specs = detectSpecs(stripped);
  if (specs.length > 0) return specs.map(s => ({ specialization: s }));

  return [{ specialization: 'All' }];
}

export function isStudentApplicable(
  audiences: NormalizedAudience[],
  specialization: Specialization,
  minor: Minor
): boolean {
  for (const aud of audiences) {
    if (aud.specialization === 'All') return true;
    if (aud.specialization === specialization) {
      if (!aud.minor) return true;
      if (aud.minor === minor) return true;
    }
  }
  return false;
}
