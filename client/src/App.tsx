import { useEffect, useState } from "react";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { MicButton } from "./components/MicButton";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { EventConfirmationCard } from "./components/EventConfirmationCard";
import { LoginButton } from "./components/LoginButton";
import { parseEvent, createCalendarEvent, getCurrentUser, type CurrentUser } from "./lib/api";
import type { ParsedEvent } from "./types/event";

type Stage = "idle" | "parsing" | "confirming" | "saving" | "success";

function App() {
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error: micError,
    start,
    stop,
    reset,
  } = useSpeechRecognition();

  const [stage, setStage] = useState<Stage>("idle");
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedLink, setSavedLink] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setUserLoaded(true));
  }, []);

  function handleMicClick() {
    if (isListening) {
      stop();
    } else {
      reset();
      setParsedEvent(null);
      setErrorMessage(null);
      setSavedLink(null);
      setStage("idle");
      start();
    }
  }

  async function handleParse() {
    if (!transcript.trim()) return;
    setStage("parsing");
    setErrorMessage(null);
    try {
      const event = await parseEvent(transcript.trim());
      setParsedEvent(event);
      setStage("confirming");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to parse transcript");
      setStage("idle");
    }
  }

  async function handleConfirm(event: ParsedEvent) {
    setStage("saving");
    setErrorMessage(null);
    try {
      const result = await createCalendarEvent(event);
      setSavedLink(result.htmlLink);
      setStage("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save event");
      setStage("confirming");
    }
  }

  function handleCancel() {
    setParsedEvent(null);
    setStage("idle");
  }

  function handleStartOver() {
    reset();
    setParsedEvent(null);
    setErrorMessage(null);
    setSavedLink(null);
    setStage("idle");
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-slate-50 px-4 py-16">
      <div className="flex w-full max-w-xl items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Voice Calendar</h1>
        {userLoaded && <LoginButton user={user} />}
      </div>

      <p className="max-w-md text-center text-slate-500">
        Tap the mic and describe an event — e.g. "Set up a meeting with Sarah next
        Tuesday at 3pm for an hour."
      </p>

      {!isSupported && (
        <p className="max-w-md rounded-md bg-amber-100 p-3 text-center text-amber-800">
          Your browser doesn't support the Web Speech API. Try Chrome or Edge on desktop.
        </p>
      )}

      {stage !== "confirming" && stage !== "success" && (
        <>
          <MicButton
            isListening={isListening}
            disabled={!isSupported || stage === "parsing"}
            onClick={handleMicClick}
          />

          {micError && <p className="text-red-600">Mic error: {micError}</p>}

          <TranscriptPanel transcript={transcript} interimTranscript={interimTranscript} />

          {transcript.trim().length > 0 && !isListening && (
            <button
              type="button"
              onClick={handleParse}
              disabled={stage === "parsing"}
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {stage === "parsing" ? "Parsing…" : "Parse transcript"}
            </button>
          )}
        </>
      )}

      {stage === "confirming" && parsedEvent && (
        <EventConfirmationCard
          event={parsedEvent}
          isSaving={false}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {stage === "saving" && parsedEvent && (
        <EventConfirmationCard
          event={parsedEvent}
          isSaving
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {stage === "success" && (
        <div className="w-full max-w-xl space-y-4 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-green-800">Event added to your Google Calendar.</p>
          {savedLink && (
            <a
              href={savedLink}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline"
            >
              View in Google Calendar
            </a>
          )}
          <div>
            <button
              type="button"
              onClick={handleStartOver}
              className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
            >
              Add another event
            </button>
          </div>
        </div>
      )}

      {errorMessage && <p className="max-w-md text-center text-red-600">{errorMessage}</p>}
    </div>
  );
}

export default App;
