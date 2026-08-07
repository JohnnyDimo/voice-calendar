# Voice Calendar

Speak a natural-language event description ("Set up a meeting with Sarah next
Tuesday at 3pm for an hour") and get a Google Calendar event created for you,
with a review/edit step in between.

**Flow:** mic → Web Speech API transcript → Claude parses the transcript into
structured JSON → you review/edit → event is created via the Google Calendar
API v3.

## Project structure

```
voice-calendar/
├── client/   Vite + React + TypeScript + Tailwind — mic capture, confirmation UI
├── server/   Node + Express + TypeScript — holds all secrets, proxies Anthropic
│             and Google, owns OAuth + session storage
└── .env.example
```

The client never talks to Anthropic or Google directly — every external API
call goes through the server, which holds the API keys.

## Prerequisites

- Node.js 20+ and npm 10+
- A Chromium-based browser (Chrome/Edge) for the frontend — the Web Speech
  API's `SpeechRecognition` isn't implemented in Firefox or Safari
- An [Anthropic API key](https://console.anthropic.com/)
- A [Google Cloud project](https://console.cloud.google.com/) with OAuth
  credentials (see below)

## 1. Google Cloud setup

1. Create (or reuse) a project at console.cloud.google.com.
2. Enable the **Google Calendar API** for that project.
3. Configure the **OAuth consent screen** (External is fine for testing;
   add your own Google account as a test user while the app is unverified).
4. Create an **OAuth client ID** (type: Web application):
   - Authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. Copy the generated Client ID and Client Secret.

## 2. Environment variables

```bash
cp .env.example server/.env
```

Then fill in `server/.env`:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `GOOGLE_CLIENT_ID` | From the OAuth client created above |
| `GOOGLE_CLIENT_SECRET` | From the OAuth client created above |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3001/auth/google/callback` for local dev |
| `PORT` | Server port (default `3001`) |
| `CLIENT_ORIGIN` | Frontend origin for CORS (default `http://localhost:5173`) |
| `SESSION_SECRET` | Any long random string, used to sign session cookies |

## 3. Install & run

```bash
npm install       # installs client + server workspaces
npm run dev       # runs both client (5173) and server (3001) concurrently
```

Open http://localhost:5173.

Individual pieces:

```bash
npm run dev:server   # just the API server
npm run dev:client   # just the Vite dev server
npm run typecheck    # type-check both workspaces
npm run build        # production build of both
```

## How it works

- **Speech capture** (`client/src/hooks/useSpeechRecognition.ts`): wraps the
  browser's `SpeechRecognition` API with live interim + final transcript
  state. No audio ever leaves the browser for this step — transcription is
  done locally by the browser/OS.
- **Parsing** (`server/src/services/anthropic.ts`): the server sends the
  transcript plus today's date/timezone to Claude with a strict system
  prompt (`EVENT_PARSER_SYSTEM_PROMPT` in that file) that requires a JSON
  object matching the event schema below. Tune that prompt directly in the
  file — it's the only place transcript → JSON parsing logic lives.

  ```ts
  interface ParsedEvent {
    title: string;
    date: string;            // YYYY-MM-DD
    startTime: string;        // 24h HH:MM
    durationMinutes: number;
    attendees: string[];      // names or emails mentioned
    location: string | null;
  }
  ```

- **Confirmation UI** (`client/src/components/EventConfirmationCard.tsx`):
  every field is editable before saving; nothing is written to your calendar
  without this step.
- **Auth & calendar write** (`server/src/routes/auth.ts`,
  `server/src/services/googleCalendar.ts`): Google Sign-In doubles as both
  the app's login mechanism and calendar authorization (one consent screen,
  `calendar.events` scope). Tokens are stored per-user in a local SQLite
  database (`server/data/app.db`, gitignored) and refreshed automatically by
  the `google-auth-library` client. Sessions are cookie-based
  (`express-session`); attendees that aren't valid email addresses (e.g. a
  first name only) are noted in the event description instead of being sent
  to the Calendar API as guests, since Google requires a real email per
  attendee.

## Notes & known limitations (v1)

- Session storage is in-memory (`express-session`'s default `MemoryStore`) —
  restarting the server logs everyone out. Fine for local dev/demo use; swap
  in `connect-sqlite3` or similar if you need sessions to survive restarts.
- The Web Speech API depends on the browser's speech-to-text backend
  (usually a cloud service under the hood for Chrome) — accuracy and
  language support vary by browser/OS.
- No production deployment config (HTTPS, secure cookies, a real session
  store) is included — see the notes above before deploying this beyond
  your own machine.
