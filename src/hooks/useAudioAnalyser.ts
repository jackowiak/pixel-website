import { useCallback, useEffect, useRef, useState } from "react";

export type AudioStatus = "idle" | "requesting" | "live" | "error";

interface UseAudioAnalyserResult {
  status: AudioStatus;
  errorMessage: string | null;
  fileName: string | null;
  analyserRef: React.RefObject<AnalyserNode | null>;
  startFromUrl: (url: string, label: string) => Promise<void>;
  stop: () => void;
}

const FFT_SIZE = 256;

/**
 * Isolates Web Audio API playback of a track (fetched by URL, decoded,
 * and routed through an AnalyserNode + the speakers) behind refs so the
 * render loop can poll frequency data every frame without triggering
 * React re-renders.
 */
export function useAudioAnalyser(): UseAudioAnalyserResult {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const fileSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // tears down whatever audio graph is currently active, without touching
  // React state — startFromUrl() calls this before wiring a new one
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

    analyserRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }, []);

  const stop = useCallback(() => {
    cleanupAudioGraph();
    setStatus("idle");
    setFileName(null);
  }, [cleanupAudioGraph]);

  const playArrayBuffer = useCallback(
    async (arrayBuffer: ArrayBuffer, label: string) => {
      if (status === "requesting") return;

      cleanupAudioGraph();
      setStatus("requesting");
      setErrorMessage(null);
      setFileName(label);

      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

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
        };

        fileSourceRef.current = bufferSource;
        analyserRef.current = analyser;
        bufferSource.start();

        setStatus("live");
      } catch {
        setErrorMessage(
          "Failed to play the audio track. Check that it's a supported format (e.g. MP3, WAV, OGG).",
        );
        setStatus("error");
        cleanupAudioGraph();
      }
    },
    [status, cleanupAudioGraph],
  );

  const startFromUrl = useCallback(
    async (url: string, label: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        await playArrayBuffer(arrayBuffer, label);
      } catch {
        setErrorMessage("Failed to load the track.");
        setStatus("error");
      }
    },
    [playArrayBuffer],
  );

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, errorMessage, fileName, analyserRef, startFromUrl, stop };
}
