import { Router } from "express";
import { parseEventFromTranscript } from "../services/anthropic.js";

export const parseRouter = Router();

parseRouter.post("/parse-event", async (req, res) => {
  const { transcript, timeZone } = req.body as { transcript?: string; timeZone?: string };

  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    res.status(400).json({ error: "Missing required string field 'transcript'" });
    return;
  }

  const tz = typeof timeZone === "string" && timeZone.length > 0 ? timeZone : "UTC";
  const now = new Date();

  try {
    const parsed = await parseEventFromTranscript(transcript, {
      isoDate: now.toLocaleDateString("en-CA", { timeZone: tz }), // YYYY-MM-DD
      dayOfWeek: now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long" }),
      timeZone: tz,
    });
    res.json(parsed);
  } catch (err) {
    console.error("parse-event failed:", err);
    res.status(502).json({ error: "Failed to parse transcript into an event" });
  }
});
