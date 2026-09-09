import { useState } from "react";
import { AudioVisualizer, DEFAULT_VISUAL_PRESET, type VisualPreset } from "./components/AudioVisualizer";
import { OverlayUI } from "./components/OverlayUI";
import { useAudioAnalyser } from "./hooks/useAudioAnalyser";
import { useCameraStream } from "./hooks/useCameraStream";

function App() {
  const audio = useAudioAnalyser();
  const camera = useCameraStream();
  const [visualPreset, setVisualPreset] = useState<VisualPreset>(DEFAULT_VISUAL_PRESET);

  const handleSelectTrack = (url: string, label: string, preset: VisualPreset) => {
    if (camera.status !== "live") {
      void camera.start();
    }
    setVisualPreset(preset);
    void audio.startFromUrl(url, label);
  };

  const handleStop = () => {
    audio.stop();
    camera.stop();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <AudioVisualizer analyserRef={audio.analyserRef} videoRef={camera.videoRef} preset={visualPreset} />
      <OverlayUI
        cameraStatus={camera.status}
        cameraError={camera.errorMessage}
        audioFileName={audio.fileName}
        audioError={audio.status === "error" ? audio.errorMessage : null}
        onSelectTrack={handleSelectTrack}
        onStop={handleStop}
      />
    </div>
  );
}

export default App;
