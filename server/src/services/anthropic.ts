import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";
import type { ParsedEvent } from "../types.js";

const anthropic = new Anthropic({ apiKey: env.anthropicApiKey });

const MODEL = "claude-opus-5";

// This is the exact system prompt sent with every parse request. Tune it here.
export const EVENT_PARSER_SYSTEM_PROMPT = `You convert a spoken, natural-language description of a calendar event into strict JSON.

Today's date, day of week, and timezone will be given to you in the user message — use them to resolve relative dates ("next Tuesday", "tomorrow", "in two weeks").

Return ONLY a single JSON object, with no markdown fences, no commentary, and no leading or trailing text. The JSON object must have exactly these keys:

{
  "title": string,            // short, human-readable event title. Infer a reasonable title if none is stated explicitly (e.g. "Meeting with Sarah").
  "date": string,             // ISO 8601 date, "YYYY-MM-DD", resolved against the reference date given to you
  "startTime": string,        // 24-hour clock, "HH:MM" (e.g. "15:00" for 3pm). If no time is stated, use "09:00".
  "durationMinutes": number,  // integer minutes. If no duration is stated, default to 30.
  "attendees": string[],      // array of attendee names or email addresses mentioned. Empty array if none.
  "location": string | null   // location or null if not mentioned. A video-call platform name (e.g. "Zoom") counts as a location.
}

Rules:
- Output must be valid JSON parseable by JSON.parse with no surrounding text.
- Never invent attendees, locations, or titles that weren't stated or reasonably implied.
- If the transcript is ambiguous or missing information, make the most reasonable assumption rather than asking a question — the user will review and edit the result before it is saved.
- Times are always in the reference timezone given to you; do not convert timezones.`;

export async function parseEventFromTranscript(
  transcript: string,
  referenceContext: { isoDate: string; dayOfWeek: string; timeZone: string }
): Promise<ParsedEvent> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: EVENT_PARSER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Reference date: ${referenceContext.isoDate} (${referenceContext.dayOfWeek})
Timezone: ${referenceContext.timeZone}

Transcript: "${transcript}"`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response contained no text content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error(`Failed to parse JSON from model response: ${textBlock.text}`);
  }

  return validateParsedEvent(parsed);
}

function validateParsedEvent(value: unknown): ParsedEvent {
  if (typeof value !== "object" || value === null) {
    throw new Error("Parsed event is not an object");
  }
  const v = value as Record<string, unknown>;

  if (typeof v.title !== "string") throw new Error("Parsed event missing string 'title'");
  if (typeof v.date !== "string") throw new Error("Parsed event missing string 'date'");
  if (typeof v.startTime !== "string") throw new Error("Parsed event missing string 'startTime'");
  if (typeof v.durationMinutes !== "number")
    throw new Error("Parsed event missing number 'durationMinutes'");
  if (!Array.isArray(v.attendees) || !v.attendees.every((a) => typeof a === "string"))
    throw new Error("Parsed event missing string[] 'attendees'");
  if (v.location !== null && typeof v.location !== "string")
    throw new Error("Parsed event 'location' must be string or null");

  return {
    title: v.title,
    date: v.date,
    startTime: v.startTime,
    durationMinutes: v.durationMinutes,
    attendees: v.attendees as string[],
    location: v.location as string | null,
  };
}
