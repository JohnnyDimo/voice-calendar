import type { ParsedEvent } from "../types/event";

async function parseJsonOrThrow(res: Response): Promise<unknown> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : res.statusText;
    throw new Error(message);
  }
  return body;
}

export async function parseEvent(transcript: string): Promise<ParsedEvent> {
  const res = await fetch("/api/parse-event", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  return (await parseJsonOrThrow(res)) as ParsedEvent;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  picture: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch("/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  return (await parseJsonOrThrow(res)) as CurrentUser;
}

export async function createCalendarEvent(event: ParsedEvent): Promise<{ htmlLink: string }> {
  const res = await fetch("/api/calendar/events", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return (await parseJsonOrThrow(res)) as { htmlLink: string };
}
