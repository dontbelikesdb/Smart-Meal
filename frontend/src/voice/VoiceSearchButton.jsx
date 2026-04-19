export default function VoiceSearchButton({
  isSupported,
  isListening,
  isTranscribing,
  onClick,
}) {
  const isBusy = isListening || isTranscribing;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isSupported || isTranscribing}
      title={
        isSupported
          ? isListening
            ? "Stop voice search"
            : isTranscribing
              ? "Transcribing voice search"
              : "Start voice search"
          : "Voice search is not supported in this browser"
      }
      aria-label={
        isSupported
          ? isListening
            ? "Stop voice search"
            : isTranscribing
              ? "Transcribing voice search"
              : "Start voice search"
          : "Voice search is not supported in this browser"
      }
      className={`absolute right-[8.25rem] lg:right-[9rem] top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl border transition-colors z-10 ${
        !isSupported
          ? "cursor-not-allowed border-white/5 bg-white/5 text-white/30"
          : isTranscribing
            ? "cursor-wait border-blue-400/40 bg-blue-500/20 text-blue-100"
          : isListening
            ? "border-red-400/40 bg-red-500/20 text-red-100"
            : "border-white/10 bg-slate-800/80 text-white hover:bg-slate-700"
      }`}
    >
      <i
        className={`fa-solid ${
          isTranscribing
            ? "fa-wave-square"
            : isListening
              ? "fa-microphone-lines"
              : "fa-microphone"
        }`}
      />
      {isBusy && <span className="sr-only">Voice search active</span>}
    </button>
  );
}
