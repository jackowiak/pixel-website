import { useEffect, useState } from "react";
import { AudioVisualizer, DEFAULT_VISUAL_PRESET, type VisualPreset } from "./components/AudioVisualizer";
import { OverlayUI } from "./components/OverlayUI";
import { useAudioAnalyser } from "./hooks/useAudioAnalyser";
import { useCameraStream } from "./hooks/useCameraStream";

function App() {
  const audio = useAudioAnalyser();
  const camera = useCameraStream();
  const [visualPreset, setVisualPreset] = useState<VisualPreset>(DEFAULT_VISUAL_PRESET);

  // camera runs ambiently from the moment the page loads, pixelated in the
  // background, independent of whether a track is playing
  useEffect(() => {
    void camera.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTrack = (url: string, label: string, preset: VisualPreset) => {
    // retry the camera if the ambient auto-start failed or was never granted
    if (camera.status === "idle" || camera.status === "error") {
      void camera.start();
    }
    setVisualPreset(preset);
    void audio.startFromUrl(url, label);
  };

  const handleStop = () => {
    audio.stop();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <AudioVisualizer analyserRef={audio.analyserRef} videoRef={camera.videoRef} preset={visualPreset} />
      <OverlayUI
        cameraStatus={camera.status}
        cameraError={camera.errorMessage}
        isPlaying={audio.status === "live"}
        audioFileName={audio.fileName}
        audioError={audio.status === "error" ? audio.errorMessage : null}
        onSelectTrack={handleSelectTrack}
        onStop={handleStop}
      />
    </div>
  );
}

export default App;
