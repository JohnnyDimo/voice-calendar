interface TranscriptPanelProps {
  transcript: string;
  interimTranscript: string;
}

export function TranscriptPanel({ transcript, interimTranscript }: TranscriptPanelProps) {
  const hasContent = transcript.length > 0 || interimTranscript.length > 0;

  return (
    <div className="min-h-24 w-full max-w-xl rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
      {hasContent ? (
        <p className="whitespace-pre-wrap text-slate-800">
          {transcript}
          {interimTranscript && (
            <span className="text-slate-400"> {interimTranscript}</span>
          )}
        </p>
      ) : (
        <p className="text-slate-400">Press the mic and start speaking…</p>
      )}
    </div>
  );
}
