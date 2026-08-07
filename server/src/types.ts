export interface ParsedEvent {
  title: string;
  date: string; // ISO date, YYYY-MM-DD
  startTime: string; // 24h HH:MM
  durationMinutes: number;
  attendees: string[];
  location: string | null;
}

export interface User {
  id: number;
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: import("./db.js").UserRow;
    }
  }
}
