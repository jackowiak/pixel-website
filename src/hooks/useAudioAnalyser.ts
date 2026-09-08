import { useCallback, useEffect, useRef, useState } from "react";

export type AudioStatus = "idle" | "requesting" | "live" | "error";
export type AudioSource = "mic" | "file" | null;

interface UseAudioAnalyserResult {
  status: AudioStatus;
  errorMessage: string | null;
  source: AudioSource;
  fileName: string | null;
  analyserRef: React.RefObject<AnalyserNode | null>;
  start: () => Promise<void>;
  startFromFile: (file: File) => Promise<void>;
  stop: () => void;
}

const FFT_SIZE = 256;

/**
 * Isolates all Web Audio API plumbing (mic input or an uploaded file)
 * behind refs so the render loop can poll frequency data every frame
 * without triggering React re-renders.
 */
export function useAudioAnalyser(): UseAudioAnalyserResult {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [source, setSource] = useState<AudioSource>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // tears down whatever audio graph is currently active, without touching
  // React state — start()/startFromFile() call this before wiring a new one
  const cleanupAudioGraph = useCallback(() => {
    if (fileSourceRef.current) {
      fileSourceRef.current.onended = null;
      try {
        fileSourceRef.current.stop();
      } catch {
        // already stopped/ended — safe to ignore
      }
      fileSourceRef.current.disconnect();
      fileSourceRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    analyserRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }, []);

  const stop = useCallback(() => {
    cleanupAudioGraph();
    setStatus("idle");
    setSource(null);
    setFileName(null);
  }, [cleanupAudioGraph]);

  const start = useCallback(async () => {
    if (status === "requesting") return;

    cleanupAudioGraph();
    setStatus("requesting");
    setErrorMessage(null);
    setFileName(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const micSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.55;

      micSource.connect(analyser);
      analyserRef.current = analyser;

      setSource("mic");
      setStatus("live");
    } catch (err) {
      let message = "Failed to access the microphone.";

      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          message = "Microphone access denied. Allow access in your browser settings.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          message = "No microphone found. Connect an audio device and try again.";
        } else if (err.name === "NotReadableError") {
          message = "The microphone is being used by another application.";
        }
      }

      setErrorMessage(message);
      setStatus("error");
      cleanupAudioGraph();
    }
  }, [status, cleanupAudioGraph]);

  const startFromFile = useCallback(
    async (file: File) => {
      if (status === "requesting") return;

      cleanupAudioGraph();
      setStatus("requesting");
      setErrorMessage(null);
      setFileName(file.name);

      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.55;

        // route through the analyser AND out to speakers so playback is audible
        bufferSource.connect(analyser);
        analyser.connect(audioContext.destination);

        bufferSource.onended = () => {
          fileSourceRef.current = null;
          analyserRef.current = null;
          setStatus("idle");
          setSource(null);
        };

        fileSourceRef.current = bufferSource;
        analyserRef.current = analyser;
        bufferSource.start();

        setSource("file");
        setStatus("live");
      } catch {
        setErrorMessage(
          "Failed to play the audio file. Check that it's a supported format (e.g. MP3, WAV, OGG).",
        );
        setStatus("error");
        cleanupAudioGraph();
      }
    },
    [status, cleanupAudioGraph],
  );

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, errorMessage, source, fileName, analyserRef, start, startFromFile, stop };
}
