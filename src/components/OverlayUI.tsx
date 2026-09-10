import type { CameraStatus } from "../hooks/useCameraStream";
import type { Track } from "../tracks";
import { TRACKS } from "../tracks";

interface OverlayUIProps {
  cameraStatus: CameraStatus;
  cameraError: string | null;
  isPlaying: boolean;
  audioFileName: string | null;
  audioError: string | null;
  onSelectTrack: (track: Track) => void;
  onStop: () => void;
}

const STATUS_CONFIG: Record<CameraStatus, { label: string; dot: string; pulse: boolean }> = {
  idle: { label: "SYSTEM IDLE", dot: "bg-zinc-500", pulse: false },
  requesting: { label: "REQUESTING ACCESS", dot: "bg-amber-400", pulse: true },
  live: { label: "LIVE", dot: "bg-emerald-400", pulse: true },
  error: { label: "CAMERA ERROR", dot: "bg-rose-500", pulse: false },
};

export function OverlayUI({
  cameraStatus,
  cameraError,
  isPlaying,
  audioFileName,
  audioError,
  onSelectTrack,
  onStop,
}: OverlayUIProps) {
  const { dot, pulse } = STATUS_CONFIG[cameraStatus];
  const label =
    isPlaying && audioFileName ? `Playing: ${audioFileName}` : STATUS_CONFIG[cameraStatus].label;
  const showPanel = !isPlaying;
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

            {isPlaying && (
              <button
                onClick={onStop}
                aria-label="Back"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 backdrop-blur-sm transition-colors hover:border-white hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M19 12H5" />
                  <path d="M11 18l-6-6 6-6" />
                </svg>
              </button>
            )}
          </div>

          {isPlaying && audioError && (
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
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {TRACKS.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  disabled={isBusy}
                  className="group relative flex aspect-square w-24 flex-col justify-between rounded-md border border-white/10 bg-white/[0.04] p-2.5 transition-all duration-150 hover:scale-[1.03] hover:border-white hover:bg-white/[0.08] active:scale-95 active:border-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-28"
                >
                  <span className="text-left text-[10px] font-bold tabular-nums text-zinc-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-left text-xs font-extrabold uppercase leading-tight tracking-tight text-white sm:text-sm">
                    {track.label}
                  </span>
                </button>
              ))}
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
