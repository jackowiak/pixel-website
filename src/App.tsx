import { AudioVisualizer } from "./components/AudioVisualizer";
import { OverlayUI } from "./components/OverlayUI";
import { useAudioAnalyser } from "./hooks/useAudioAnalyser";
import { useCameraStream } from "./hooks/useCameraStream";

function App() {
  const audio = useAudioAnalyser();
  const camera = useCameraStream();

  const handleStartMic = () => {
    void camera.start();
    void audio.start();
  };

  const handleFileSelected = (file: File) => {
    if (camera.status !== "live") {
      void camera.start();
    }
    void audio.startFromFile(file);
  };

  const handleStop = () => {
    audio.stop();
    camera.stop();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030305]">
      <AudioVisualizer analyserRef={audio.analyserRef} videoRef={camera.videoRef} />
      <OverlayUI
        cameraStatus={camera.status}
        cameraError={camera.errorMessage}
        audioSource={audio.source}
        audioFileName={audio.fileName}
        audioError={audio.status === "error" ? audio.errorMessage : null}
        onStartMic={handleStartMic}
        onFileSelected={handleFileSelected}
        onStop={handleStop}
      />
    </div>
  );
}

export default App;
