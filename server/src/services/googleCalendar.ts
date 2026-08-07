import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { env } from "../env.js";
import { updateUserTokens, type UserRow } from "../db.js";
import type { ParsedEvent } from "../types.js";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
];

function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

export function getGoogleAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: number | null;
}

export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: client, version: "v2" });
  const { data } = await oauth2.userinfo.get();

  if (!data.id || !data.email) {
    throw new Error("Google userinfo response missing id or email");
  }

  return {
    googleId: data.id,
    email: data.email,
    name: data.name ?? data.email,
    picture: data.picture ?? null,
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token ?? null,
    tokenExpiry: tokens.expiry_date ?? null,
  };
}

function clientForUser(user: UserRow): OAuth2Client {
  const client = createOAuthClient();
  client.setCredentials({
    access_token: user.access_token,
    refresh_token: user.refresh_token ?? undefined,
    expiry_date: user.token_expiry ?? undefined,
  });

  client.on("tokens", (tokens) => {
    updateUserTokens(user.id, {
      accessToken: tokens.access_token ?? user.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiry: tokens.expiry_date ?? null,
    });
  });

  return client;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createGoogleCalendarEvent(
  user: UserRow,
  event: ParsedEvent
): Promise<{ htmlLink: string }> {
  const auth = clientForUser(user);
  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(`${event.date}T${event.startTime}:00`);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);

  // The parser may return plain names ("Sarah") alongside real emails. The
  // Calendar API only accepts email addresses as attendees, so anything
  // that isn't one goes into the description instead of breaking the call.
  const emailAttendees = event.attendees.filter((a) => EMAIL_RE.test(a));
  const namedAttendees = event.attendees.filter((a) => !EMAIL_RE.test(a));
  const description =
    namedAttendees.length > 0 ? `Also mentioned: ${namedAttendees.join(", ")}` : undefined;

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description,
      location: event.location ?? undefined,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: emailAttendees.map((email) => ({ email })),
    },
  });

  return { htmlLink: data.htmlLink ?? "" };
}
