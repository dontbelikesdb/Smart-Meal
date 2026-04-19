import { useCallback, useEffect, useRef, useState } from "react";

import { transcribeVoice } from "../api/voiceApi";

const isMediaRecordingSupported = () =>
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof window.MediaRecorder !== "undefined";

const getPreferredRecordingType = () => {
  if (!isMediaRecordingSupported()) return "";

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
  ];

  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore browser-specific MIME probing failures.
    }
  }

  return "";
};

const getExtensionForMimeType = (type) => {
  const mimeType = String(type || "").toLowerCase();
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  return "webm";
};

const toErrorMessage = (error) => {
  const detail =
    error?.response?.data?.detail || error?.message || String(error || "");
  const message = detail.toLowerCase();

  if (message.includes("notallowederror") || message.includes("permission")) {
    return "Microphone access was denied.";
  }
  if (message.includes("notfounderror") || message.includes("no microphone")) {
    return "No microphone was found on this device.";
  }
  if (message.includes("not configured")) {
    return "Voice transcription is not configured on the server.";
  }
  if (message.includes("unsupported audio format")) {
    return "This browser recorded an unsupported audio format. Try Chrome, Edge, or Safari.";
  }
  if (message.includes("returned no text")) {
    return "Could not understand the recording. Try speaking more clearly.";
  }
  if (message.includes("failed")) {
    return detail;
  }
  return "Voice search failed. Try again.";
};

export default function useVoiceSearch({ onTranscript }) {
  const callbackRef = useRef(onTranscript);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    setIsSupported(isMediaRecordingSupported());
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startListening = useCallback(async () => {
    if (!isMediaRecordingSupported()) {
      setIsSupported(false);
      setError("Voice search is not supported in this browser.");
      return;
    }

    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredRecordingType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        setError(toErrorMessage(event?.error || new Error("recording failed")));
        setIsListening(false);
        cleanupStream();
      };

      recorder.onstop = async () => {
        setIsListening(false);

        const chunks = [...chunksRef.current];
        const type =
          chunks[0]?.type ||
          recorder.mimeType ||
          "audio/webm";
        cleanupStream();

        if (!chunks.length) {
          setError("No speech detected. Try again.");
          return;
        }

        setIsTranscribing(true);
        try {
          const blob = new Blob(chunks, { type });
          const extension = getExtensionForMimeType(type);
          const response = await transcribeVoice(
            blob,
            `voice-search.${extension}`,
          );
          const transcript = String(response?.data?.text || "").trim();
          if (!transcript) {
            setError("Could not understand the recording. Try again.");
            return;
          }
          callbackRef.current?.(transcript);
        } catch (err) {
          setError(toErrorMessage(err));
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsListening(true);
    } catch (err) {
      cleanupStream();
      setError(toErrorMessage(err));
    }
  }, [cleanupStream]);

  const stopListening = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch (err) {
      cleanupStream();
      setIsListening(false);
      setError(toErrorMessage(err));
    }
  }, [cleanupStream]);

  const toggleListening = useCallback(() => {
    if (isTranscribing) return;
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, isTranscribing, startListening, stopListening]);

  useEffect(() => cleanupStream, [cleanupStream]);

  return {
    isSupported,
    isListening,
    isTranscribing,
    error,
    setError,
    startListening,
    stopListening,
    toggleListening,
  };
}
