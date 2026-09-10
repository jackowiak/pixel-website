import { useEffect, useRef, useState } from "react";
import { AudioVisualizer, DEFAULT_VISUAL_PRESET, type VisualPreset } from "./components/AudioVisualizer";
import { OverlayUI } from "./components/OverlayUI";
import { useAudioAnalyser } from "./hooks/useAudioAnalyser";
import { useCameraStream } from "./hooks/useCameraStream";
import { useRemoteControl } from "./hooks/useRemoteControl";
import { findTrackById, type Track } from "./tracks";

function App() {
  const audio = useAudioAnalyser();
  const camera = useCameraStream();
  const { remoteTrackId, remotePreset, publishTrackSelection } = useRemoteControl();
  const [visualPreset, setVisualPreset] = useState<VisualPreset>(DEFAULT_VISUAL_PRESET);

  // tracks what's actually loaded right now, regardless of whether the
  // pick came from a local pad click or a remote pilot update — used to
  // stop the Firebase round-trip from re-triggering itself
  const currentTrackIdRef = useRef<string | null>(null);

  const applyTrack = (track: Track) => {
    currentTrackIdRef.current = track.id;
    if (camera.status !== "live") {
      void camera.start();
    }
    setVisualPreset(track.preset);
    void audio.startFromUrl(track.url, track.label);
    publishTrackSelection(track);
  };

  const handleStop = () => {
    currentTrackIdRef.current = null;
    audio.stop();
    camera.stop();
    publishTrackSelection(null);
  };

  // react to the pilot app remotely picking or stopping a track
  useEffect(() => {
    if (remoteTrackId === currentTrackIdRef.current) return;

    if (remoteTrackId === null) {
      currentTrackIdRef.current = null;
      audio.stop();
      camera.stop();
      return;
    }

    const track = findTrackById(remoteTrackId);
    if (track) applyTrack(track);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteTrackId]);

  // once a track is live, the pilot's slider tweaks (mirrored through
  // Firebase) take priority over the track's baked-in defaults
  const appliedPreset = remotePreset ?? visualPreset;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <AudioVisualizer analyserRef={audio.analyserRef} videoRef={camera.videoRef} preset={appliedPreset} />
      <OverlayUI
        cameraStatus={camera.status}
        cameraError={camera.errorMessage}
        isPlaying={audio.status === "live"}
        audioFileName={audio.fileName}
        audioError={audio.status === "error" ? audio.errorMessage : null}
        onSelectTrack={applyTrack}
        onStop={handleStop}
      />
    </div>
  );
}

export default App;
