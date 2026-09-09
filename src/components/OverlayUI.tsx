import type { CameraStatus } from "../hooks/useCameraStream";
import type { VisualPreset } from "./AudioVisualizer";

interface OverlayUIProps {
  cameraStatus: CameraStatus;
  cameraError: string | null;
  audioFileName: string | null;
  audioError: string | null;
  onSelectTrack: (url: string, label: string, preset: VisualPreset) => void;
  onStop: () => void;
}

type PadAccent = "cyan" | "blue" | "red" | "white";

const TRACKS: { url: string; label: string; accent: PadAccent; preset: VisualPreset }[] = [
  {
    url: "/tracks/redhed.m4a",
    label: "Redhed",
    accent: "red",
    // hot & blown-out: chunky pixels, strong bass-driven brightness
    preset: { baseCols: 100, minCols: 14, contrastMul: 1.1, brightnessBias: 20, jitterMul: 1.1 },
  },
  {
    url: "/tracks/response.m4a",
    label: "Response",
    accent: "cyan",
    // fine detail, crisp high-contrast snap on the highs
    preset: { baseCols: 132, minCols: 20, contrastMul: 1.7, brightnessBias: -5, jitterMul: 0.8 },
  },
  {
    url: "/tracks/revolut.m4a",
    label: "Revolut",
    accent: "blue",
    // moody and dark, stays blue/black longer before flashing bright
    preset: { baseCols: 105, minCols: 18, contrastMul: 0.85, brightnessBias: -25, jitterMul: 0.9 },
  },
  {
    url: "/tracks/slut.m4a",
    label: "Slut",
    accent: "white",
    // washed out and soft, leans bright even at rest
    preset: { baseCols: 95, minCols: 22, contrastMul: 0.7, brightnessBias: 30, jitterMul: 0.7 },
  },
  {
    url: "/tracks/latestageofsumma1.mp3",
    label: "Late Stage Of Summa",
    accent: "blue",
    // glitchy, jittery, unstable
    preset: { baseCols: 116, minCols: 16, contrastMul: 1.3, brightnessBias: 5, jitterMul: 1.7 },
  },
  {
    url: "/tracks/boner2_74bpm.m4a",
    label: "Boner 2 (74 BPM)",
    accent: "red",
    // coarse and blocky even without much bass
    preset: { baseCols: 68, minCols: 10, contrastMul: 1.2, brightnessBias: 10, jitterMul: 1.3 },
  },
];

const PAD_ACCENTS: Record<PadAccent, { border: string; text: string }> = {
  cyan: {
    border: "hover:border-cyan-400 active:border-cyan-300",
    text: "group-hover:text-cyan-300",
  },
  blue: {
    border: "hover:border-blue-400 active:border-blue-300",
    text: "group-hover:text-blue-300",
  },
  red: {
    border: "hover:border-red-400 active:border-red-300",
    text: "group-hover:text-red-300",
  },
  white: {
    border: "hover:border-white active:border-white",
    text: "group-hover:text-white",
  },
};

const STATUS_CONFIG: Record<CameraStatus, { label: string; dot: string; pulse: boolean }> = {
  idle: { label: "SYSTEM IDLE", dot: "bg-zinc-500", pulse: false },
  requesting: { label: "REQUESTING ACCESS", dot: "bg-amber-400", pulse: true },
  live: { label: "LIVE", dot: "bg-emerald-400", pulse: true },
  error: { label: "CAMERA ERROR", dot: "bg-rose-500", pulse: false },
};

export function OverlayUI({
  cameraStatus,
  cameraError,
  audioFileName,
  audioError,
  onSelectTrack,
  onStop,
}: OverlayUIProps) {
  const { dot, pulse } = STATUS_CONFIG[cameraStatus];
  const label =
    cameraStatus === "live" && audioFileName
      ? `Playing: ${audioFileName}`
      : STATUS_CONFIG[cameraStatus].label;
  const showPanel = cameraStatus !== "live";
  const isBusy = cameraStatus === "requesting";

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-6 sm:p-8">
      {/* top bar: status */}
      <div className="flex flex-wrap items-start justify-end gap-3">
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-200 backdrop-blur-sm">
              <span className="relative flex h-2 w-2 shrink-0">
                {pulse && (
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60`}
                  />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
              </span>
              <span className="max-w-[40vw] truncate normal-case sm:max-w-xs">{label}</span>
            </div>

            {cameraStatus === "live" && (
              <button
                onClick={onStop}
                className="rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-200 backdrop-blur-sm transition-colors hover:border-rose-400 hover:text-rose-300"
              >
                Stop
              </button>
            )}
          </div>

          {cameraStatus === "live" && audioError && (
            <span className="max-w-[70vw] text-right text-[11px] font-semibold text-amber-400/90 sm:max-w-xs">
              {audioError}
            </span>
          )}
        </div>
      </div>

      {/* center panel: flat black tile grid */}
      {showPanel && (
        <div className="pointer-events-auto mx-auto flex flex-col items-center gap-4 self-center">
          <div className="relative flex flex-col items-center gap-4 p-4">
            {isBusy && (
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Loading</p>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {TRACKS.map((track, i) => {
                const accent = PAD_ACCENTS[track.accent];
                return (
                  <button
                    key={track.url}
                    onClick={() => onSelectTrack(track.url, track.label, track.preset)}
                    disabled={isBusy}
                    className={`group relative flex aspect-square w-24 flex-col justify-between rounded-md border border-white/10 bg-white/[0.04] p-2.5 transition-all duration-150 hover:scale-[1.03] hover:bg-white/[0.08] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-28 ${accent.border}`}
                  >
                    <span className="text-left text-[10px] font-bold tabular-nums text-zinc-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-left text-xs font-extrabold uppercase leading-tight tracking-tight text-white transition-colors sm:text-sm ${accent.text}`}
                    >
                      {track.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {(cameraError || audioError) && (
            <p className="max-w-xs text-center text-xs font-semibold text-rose-400">
              {cameraError ?? audioError}
            </p>
          )}
        </div>
      )}

      {/* footer spacer to balance the top bar in the flex layout */}
      <div className="pointer-events-none h-4" />
    </div>
  );
}
