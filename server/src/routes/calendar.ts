import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { createGoogleCalendarEvent } from "../services/googleCalendar.js";
import type { ParsedEvent } from "../types.js";

export const calendarRouter = Router();

calendarRouter.post("/calendar/events", requireAuth, async (req, res) => {
  const event = req.body as Partial<ParsedEvent>;

  if (
    typeof event.title !== "string" ||
    typeof event.date !== "string" ||
    typeof event.startTime !== "string" ||
    typeof event.durationMinutes !== "number" ||
    !Array.isArray(event.attendees)
  ) {
    res.status(400).json({ error: "Malformed event payload" });
    return;
  }

  try {
    const result = await createGoogleCalendarEvent(req.currentUser!, {
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      durationMinutes: event.durationMinutes,
      attendees: event.attendees.filter((a): a is string => typeof a === "string"),
      location: event.location ?? null,
    });
    res.json(result);
  } catch (err) {
    console.error("Failed to create calendar event:", err);
    res.status(502).json({ error: "Failed to create calendar event" });
  }
});
