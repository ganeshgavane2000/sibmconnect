export interface DayMenu {
  breakfast: string[];
  lunch: string[];
  eveningSnacks: string[];
  dinner: string[];
}

export interface WeeklyMenu {
  [day: string]: DayMenu;
}

const EDGE_FUNCTION_URL = 'https://pnqrksjddknvwsvbodvg.supabase.co/functions/v1/extract-menu';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBucXJrc2pkZGtudndzdmJvZHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjExMzUsImV4cCI6MjA5ODIzNzEzNX0.wSUh7422TFXr3ej1uLySc9OKmUIJFYBjbhvmIQ8osNM';

async function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        data: result.split(',')[1],
        mediaType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractMenuFromPhoto(file: File): Promise<WeeklyMenu> {
  const { data, mediaType } = await fileToBase64(file);

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ imageBase64: data, mediaType }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Menu extraction failed (${res.status}): ${err.slice(0, 150)}`);
  }

  const result = await res.json();
  if (result.error) throw new Error(result.error);
  if (!result.menu) throw new Error('No menu returned from AI');

  return result.menu as WeeklyMenu;
}
