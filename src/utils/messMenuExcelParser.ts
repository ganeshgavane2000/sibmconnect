import * as XLSX from 'xlsx';
import type { WeeklyMenu, DayMenu } from './menuExtractor';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function isSectionHeader(val: string): keyof DayMenu | null {
  // Strip emojis, special chars, extra spaces
  const n = val.replace(/[^\w\s]/g, '').toLowerCase().trim();
  if (n.includes('break') || n.includes('breakfast')) return 'breakfast';
  if (n.includes('evening') || n.includes('snack')) return 'eveningSnacks';
  if (n.includes('dinner')) return 'dinner';
  if (n.includes('lunch')) return 'lunch';
  return null;
}

// Strip "Category: " prefix for display — just show the item
function cleanItem(category: string, value: string): string {
  const cat = category.trim();
  const val = value.trim();
  // For items where category adds context (Indian, Veg Gravy, etc.), keep it
  // For generic ones (Pickle, Salad, Cereal), show just value
  const generic = ['pickle', 'salad', 'papad', 'rice', 'phulka', 'chapati', 'roti', 'soup', 'sweet', 'fruit', 'bread', 'egg', 'beverages', 'cereal'];
  const catLower = cat.toLowerCase();
  if (generic.some(g => catLower.includes(g))) return val;
  return `${cat}: ${val}`;
}

export async function parseMessMenuExcel(file: File): Promise<WeeklyMenu> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];

  if (rows.length === 0) throw new Error('Excel file appears to be empty');

  // Detect day columns from header row
  const headerRow = rows[0].map(c => String(c).toUpperCase());
  const dayColMap: Record<string, number> = {};

  for (let col = 1; col < headerRow.length; col++) {
    const cell = headerRow[col];
    for (const day of DAYS) {
      if (cell.includes(day.toUpperCase().slice(0, 3))) {
        dayColMap[day] = col;
        break;
      }
    }
  }

  if (Object.keys(dayColMap).length === 0) {
    throw new Error('Could not find day columns. Make sure row 1 has Mon/Tue/Wed... headers.');
  }

  // Initialize weekly menu
  const menu: WeeklyMenu = {};
  for (const day of DAYS) {
    if (dayColMap[day] !== undefined) {
      menu[day] = { breakfast: [], lunch: [], eveningSnacks: [], dinner: [] };
    }
  }

  let currentMeal: keyof DayMenu | null = null;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const category = String(row[0] || '').trim();
    if (!category) continue;

    // Skip note/footer rows
    if (category.toLowerCase().includes('note') || category.toLowerCase().includes('menu from')) continue;

    // Check if this row is a section header
    const section = isSectionHeader(category);
    if (section) {
      currentMeal = section;
      continue;
    }

    if (!currentMeal) continue;

    // Add items for each day
    for (const day of DAYS) {
      const col = dayColMap[day];
      if (col === undefined) continue;

      const val = String(row[col] || '').trim();
      if (!val || val === 'N/A' || val === '—' || val === '-' || val === 'NA') continue;

      menu[day][currentMeal].push(cleanItem(category, val));
    }
  }

  const hasData = Object.values(menu).some(d =>
    d.breakfast.length > 0 || d.lunch.length > 0 || d.dinner.length > 0
  );
  if (!hasData) throw new Error('No menu data found. Check the file format.');

  return menu;
}
