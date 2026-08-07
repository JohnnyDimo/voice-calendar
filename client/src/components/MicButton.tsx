interface MicButtonProps {
  isListening: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function MicButton({ isListening, disabled, onClick }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? "Stop recording" : "Start recording"}
      className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition
        ${isListening ? "bg-red-500 animate-pulse" : "bg-indigo-600 hover:bg-indigo-500"}
        disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9">
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
        <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z" />
      </svg>
    </button>
  );
}
