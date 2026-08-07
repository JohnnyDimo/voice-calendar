export interface ParsedEvent {
  title: string;
  date: string; // ISO date, YYYY-MM-DD
  startTime: string; // 24h HH:MM
  durationMinutes: number;
  attendees: string[];
  location: string | null;
}
