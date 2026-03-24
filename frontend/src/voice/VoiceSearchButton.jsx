export default function VoiceSearchButton({
  isSupported,
  isListening,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isSupported}
      title={
        isSupported
          ? isListening
            ? "Stop voice search"
            : "Start voice search"
          : "Voice search is not supported in this browser"
      }
      aria-label={
        isSupported
          ? isListening
            ? "Stop voice search"
            : "Start voice search"
          : "Voice search is not supported in this browser"
      }
      className={`absolute right-20 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl border transition-colors ${
        !isSupported
          ? "cursor-not-allowed border-white/5 bg-white/5 text-white/30"
          : isListening
            ? "border-red-400/40 bg-red-500/20 text-red-100"
            : "border-white/10 bg-slate-800/80 text-white hover:bg-slate-700"
      }`}
    >
      <i
        className={`fa-solid ${
          isListening ? "fa-microphone-lines" : "fa-microphone"
        }`}
      />
    </button>
  );
}
