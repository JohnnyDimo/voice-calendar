import { useState } from "react";
import type { ParsedEvent } from "../types/event";

interface EventConfirmationCardProps {
  event: ParsedEvent;
  isSaving: boolean;
  onConfirm: (event: ParsedEvent) => void;
  onCancel: () => void;
}

export function EventConfirmationCard({
  event,
  isSaving,
  onConfirm,
  onCancel,
}: EventConfirmationCardProps) {
  const [draft, setDraft] = useState<ParsedEvent>(event);
  const [attendeesText, setAttendeesText] = useState(event.attendees.join(", "));

  function update<K extends keyof ParsedEvent>(key: K, value: ParsedEvent[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const attendees = attendeesText
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    onConfirm({ ...draft, attendees });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">Review event</h2>

      <label className="block">
        <span className="text-sm font-medium text-slate-600">Title</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-600">Date</span>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => update("date", e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-600">Start time</span>
          <input
            type="time"
            value={draft.startTime}
            onChange={(e) => update("startTime", e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-600">Duration (minutes)</span>
        <input
          type="number"
          min={5}
          step={5}
          value={draft.durationMinutes}
          onChange={(e) => update("durationMinutes", Number(e.target.value))}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-600">Attendees (comma-separated)</span>
        <input
          type="text"
          value={attendeesText}
          onChange={(e) => setAttendeesText(e.target.value)}
          placeholder="sarah@example.com, John Doe"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-600">Location</span>
        <input
          type="text"
          value={draft.location ?? ""}
          onChange={(e) => update("location", e.target.value || null)}
          placeholder="Zoom, office, etc."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
        />
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-md px-4 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Add to Calendar"}
        </button>
      </div>
    </form>
  );
}
