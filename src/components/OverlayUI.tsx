import type { CameraStatus } from "../hooks/useCameraStream";

interface OverlayUIProps {
  cameraStatus: CameraStatus;
  cameraError: string | null;
  audioFileName: string | null;
  audioError: string | null;
  onSelectTrack: (url: string, label: string) => void;
  onStop: () => void;
}

const TRACKS: { url: string; label: string }[] = [
  { url: "/tracks/redhed.m4a", label: "Redhed" },
  { url: "/tracks/response.m4a", label: "Response" },
  { url: "/tracks/revolut.m4a", label: "Revolut" },
  { url: "/tracks/slut.m4a", label: "Slut" },
  { url: "/tracks/boner2.m4a", label: "Boner 2" },
  { url: "/tracks/boner2_74bpm.m4a", label: "Boner 2 (74 BPM)" },
];

const STATUS_CONFIG: Record<CameraStatus, { label: string; dot: string; pulse: boolean }> = {
  idle: { label: "SYSTEM IDLE", dot: "bg-zinc-500", pulse: false },
  requesting: { label: "REQUESTING ACCESS...", dot: "bg-amber-400", pulse: true },
  live: { label: "LIVE CAMERA FEED", dot: "bg-emerald-400", pulse: true },
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
      ? `PLAYING: ${audioFileName}`
      : STATUS_CONFIG[cameraStatus].label;
  const showPanel = cameraStatus !== "live";
  const isBusy = cameraStatus === "requesting";

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-6 sm:p-8">
      {/* top bar: status */}
      <div className="flex flex-wrap items-start justify-end gap-3 font-mono">
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] tracking-widest text-zinc-300 backdrop-blur-sm sm:text-xs">
              <span className="relative flex h-2 w-2 shrink-0">
                {pulse && (
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60`}
                  />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
              </span>
              <span className="max-w-[40vw] truncate sm:max-w-xs">{label}</span>
            </div>

            {cameraStatus === "live" && (
              <button
                onClick={onStop}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] tracking-widest text-zinc-300 backdrop-blur-sm transition-colors hover:border-rose-400/60 hover:text-rose-300 sm:text-xs"
              >
                ■ STOP
              </button>
            )}
          </div>

          {cameraStatus === "live" && audioError && (
            <span className="max-w-[70vw] text-right text-[10px] tracking-wide text-amber-400/80 sm:max-w-xs">
              {audioError}
            </span>
          )}
        </div>
      </div>

      {/* center panel: camera-viewfinder style, no boxed card */}
      {showPanel && (
        <div className="pointer-events-auto mx-auto flex flex-col items-center gap-4 self-center">
          <div className="relative flex aspect-square w-[min(80vmin,520px)] items-center justify-center">
            {/* reticle corner brackets */}
            <span className="absolute left-0 top-0 h-7 w-7 border-l-2 border-t-2 border-cyan-400/70 sm:h-9 sm:w-9" />
            <span className="absolute right-0 top-0 h-7 w-7 border-r-2 border-t-2 border-cyan-400/70 sm:h-9 sm:w-9" />
            <span className="absolute bottom-0 left-0 h-7 w-7 border-b-2 border-l-2 border-cyan-400/70 sm:h-9 sm:w-9" />
            <span className="absolute bottom-0 right-0 h-7 w-7 border-b-2 border-r-2 border-cyan-400/70 sm:h-9 sm:w-9" />

            {/* soft vignette behind the text so it reads over the live pixel background */}
            <div className="absolute h-4/5 w-4/5 rounded-full bg-black/50 blur-2xl" />

            <div className="relative flex flex-col items-center gap-3 px-6 text-center">
              <p className="text-[10px] tracking-[0.3em] text-zinc-500">
                {isBusy ? "LOADING..." : "SELECT A TRACK"}
              </p>
              {TRACKS.map((track) => (
                <button
                  key={track.url}
                  onClick={() => onSelectTrack(track.url, track.label)}
                  disabled={isBusy}
                  className="text-xs font-bold tracking-[0.2em] text-cyan-300 transition-all duration-200 hover:text-cyan-200 hover:drop-shadow-[0_0_14px_rgba(34,211,238,0.6)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  [ {track.label.toUpperCase()} ]
                </button>
              ))}
            </div>
          </div>

          {(cameraError || audioError) && (
            <p className="max-w-xs text-[11px] tracking-wide text-rose-400">
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
