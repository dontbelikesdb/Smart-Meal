import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognitionCtor = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const toErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was denied.";
    case "no-speech":
      return "No speech detected. Try again.";
    case "audio-capture":
      return "No microphone was found on this device.";
    case "network":
      return "Voice search hit a network issue. Try again.";
    default:
      return "Voice search failed. Try again.";
  }
};

export default function useVoiceSearch({ onTranscript }) {
  const callbackRef = useRef(onTranscript);
  const recognitionRef = useRef(null);

  const [isSupported, setIsSupported] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      recognitionRef.current = null;
      return undefined;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";

    recognition.onstart = () => {
      setError("");
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      if (event?.error === "aborted") return;
      setError(toErrorMessage(event?.error));
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript) {
        callbackRef.current?.(transcript);
      }
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.abort();
      } catch {
        // Ignore teardown errors from browsers with partial API support.
      }
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Voice search is not supported in this browser.");
      return;
    }

    setError("");
    try {
      recognitionRef.current.start();
    } catch {
      setError("Voice search is already active. Try again in a moment.");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore browser-specific stop errors.
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    error,
    setError,
    startListening,
    stopListening,
    toggleListening,
  };
}
