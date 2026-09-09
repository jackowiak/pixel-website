import { useEffect, useRef } from "react";

/**
 * Per-track visual character. Lets each pad give the same audio-reactive
 * pipeline a distinct feel instead of every track looking identical.
 */
export interface VisualPreset {
  baseCols: number; // grid columns at silence (higher = finer detail)
  minCols: number; // grid columns at full bass (chunkiest blocks)
  contrastMul: number; // multiplies how hard treble sharpens color bands
  brightnessBias: number; // flat offset on the bass brightness boost
  jitterMul: number; // multiplies fallback-grid glitch displacement
}

export const DEFAULT_VISUAL_PRESET: VisualPreset = {
  baseCols: 110,
  minCols: 16,
  contrastMul: 1,
  brightnessBias: 0,
  jitterMul: 1,
};

interface AudioVisualizerProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  preset?: VisualPreset;
}

const MAX_DPR = 1.5;

// fallback synthetic grid (used when no camera feed is available)
const FALLBACK_CELL_SIZE = 26;

const COLOR_BLACK: [number, number, number] = [0, 0, 0];
const COLOR_BLUE: [number, number, number] = [0, 71, 255];
const COLOR_RED: [number, number, number] = [255, 26, 26];
const COLOR_WHITE: [number, number, number] = [245, 245, 245];

function hash01(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Full-viewport canvas that pixelates the live camera feed and recolors
 * it into a 4-tone palette (black / blue / red / white), both driven by
 * live frequency data: bass controls block size (pixelation coarseness),
 * treble controls color contrast, and bass also brightens the palette
 * mapping. Falls back to a synthetic audio-reactive grid when no camera
 * frame is available (denied / still loading).
 *
 * Perf note: the expensive per-pixel color quantization only ever runs
 * on a tiny offscreen buffer (grid resolution, not screen resolution) —
 * the final upscale to full size is a single GPU-accelerated drawImage.
 */
export function AudioVisualizer({
  analyserRef,
  videoRef,
  preset = DEFAULT_VISUAL_PRESET,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presetRef = useRef(preset);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const smallCanvas = document.createElement("canvas");
    const smallCtx = smallCanvas.getContext("2d", { willReadFrequently: true });
    if (!smallCtx) return;

    let width = 0;
    let height = 0;
    let rafId = 0;
    let time = 0;
    let smoothedBass = 0;
    let smoothedTreble = 0;
    let bassPeak = 0.12;
    let treblePeak = 0.08;
    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const renderVideoPixels = (bass: number, treble: number) => {
      const video = videoRef.current!;
      const { baseCols, minCols, contrastMul, brightnessBias } = presetRef.current;
      const cols = Math.max(minCols, Math.round(baseCols - (baseCols - minCols) * bass));
      const rows = Math.max(8, Math.round(cols * (height / width)));

      if (smallCanvas.width !== cols || smallCanvas.height !== rows) {
        smallCanvas.width = cols;
        smallCanvas.height = rows;
      }

      const videoW = video.videoWidth;
      const videoH = video.videoHeight;
      const targetAspect = width / height;
      const videoAspect = videoW / videoH;

      let sx = 0;
      let sy = 0;
      let sw = videoW;
      let sh = videoH;
      if (videoAspect > targetAspect) {
        sw = videoH * targetAspect;
        sx = (videoW - sw) / 2;
      } else {
        sh = videoW / targetAspect;
        sy = (videoH - sh) / 2;
      }

      // mirror horizontally for a natural "selfie" view
      smallCtx.save();
      smallCtx.translate(cols, 0);
      smallCtx.scale(-1, 1);
      smallCtx.drawImage(video, sx, sy, sw, sh, 0, 0, cols, rows);
      smallCtx.restore();

      const imgData = smallCtx.getImageData(0, 0, cols, rows);
      const data = imgData.data;

      // treble sharpens the black/blue/red/white split into hard contrast;
      // bass brightens the whole mapping, pushing more of the image toward red/white
      const contrast = 1 + treble * 2.2 * contrastMul;
      const brightnessBoost = (bass - 0.22) * 150 + brightnessBias;
      const t1 = 128 - 38 * contrast;
      const t2 = 128 + 42 * contrast;
      const t3 = 128 + 82 * contrast;

      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] + brightnessBoost;

        let color: [number, number, number];
        if (lum < t1) color = COLOR_BLACK;
        else if (lum < t2) color = COLOR_BLUE;
        else if (lum < t3) color = COLOR_RED;
        else color = COLOR_WHITE;

        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
      }

      smallCtx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(smallCanvas, 0, 0, cols, rows, 0, 0, width, height);
    };

    const renderFallbackGrid = (
      bass: number,
      treble: number,
      time: number,
      freqData: Uint8Array<ArrayBuffer> | null,
    ) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const cellSize = FALLBACK_CELL_SIZE * (1 + bass * 2.2);
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;
      const timeBucket = Math.floor(time * 4);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const baseX = col * cellSize;
          const baseY = row * cellSize;

          let binIntensity = 0;
          if (freqData) {
            const binIndex = Math.min(
              freqData.length - 1,
              Math.floor((col / cols) * freqData.length),
            );
            binIntensity = freqData[binIndex] / 255;
          }

          const intensity = Math.min(1, binIntensity * 0.75 + treble * 0.55);

          const n1 = hash01(col, row + timeBucket * 0.5);
          const n2 = hash01(col + timeBucket * 0.5, row);
          const jitterMul = presetRef.current.jitterMul;
          const jitterX = (n1 - 0.5) * treble * cellSize * 2.2 * jitterMul;
          const jitterY = (n2 - 0.5) * treble * cellSize * 2.2 * jitterMul;

          let color: string;
          if (intensity < 0.35) continue; // background already black, skip draw
          else if (intensity < 0.7) color = "#0047ff";
          else if (intensity < 0.88) color = "#ff1a1a";
          else color = "#f5f5f5";

          const rectSize = cellSize * (0.3 + intensity * 0.7);
          const offset = (cellSize - rectSize) / 2;

          ctx.fillStyle = color;
          ctx.fillRect(baseX + offset + jitterX, baseY + offset + jitterY, rectSize, rectSize);
        }
      }
    };

    const render = () => {
      rafId = requestAnimationFrame(render);
      time += 0.016;

      const analyser = analyserRef.current;
      let bassNorm: number;
      let trebleNorm: number;
      let freqData: Uint8Array<ArrayBuffer> | null = null;

      if (analyser) {
        if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
        freqData = dataArray;
        analyser.getByteFrequencyData(freqData);

        const bassBins = Math.max(1, Math.floor(freqData.length * 0.12));
        let bassSum = 0;
        for (let i = 0; i < bassBins; i++) bassSum += freqData[i];
        const bassEnergy = bassSum / bassBins / 255;

        const trebleStart = Math.floor(freqData.length * 0.55);
        let trebleSum = 0;
        for (let i = trebleStart; i < freqData.length; i++) trebleSum += freqData[i];
        const trebleEnergy = trebleSum / (freqData.length - trebleStart) / 255;

        // auto-gain: normalize against a slowly-decaying recent peak so the
        // effect stays lively on quiet tracks, not just loud ones
        bassPeak = Math.max(bassEnergy, bassPeak * 0.985);
        treblePeak = Math.max(trebleEnergy, treblePeak * 0.985);
        bassNorm = Math.min(1, bassEnergy / Math.max(bassPeak, 0.05));
        trebleNorm = Math.min(1, trebleEnergy / Math.max(treblePeak, 0.04));
      } else {
        // gentle ambient idle animation before audio is live (no AGC: these
        // are already small, deliberate values, not something to amplify)
        bassNorm = 0.08 + Math.sin(time * 0.6) * 0.03;
        trebleNorm = 0.05 + Math.sin(time * 0.9 + 1) * 0.02;
      }

      smoothedBass += (bassNorm - smoothedBass) * 0.45;
      smoothedTreble += (trebleNorm - smoothedTreble) * 0.55;

      const video = videoRef.current;
      const hasVideo = !!video && video.readyState >= 2 && video.videoWidth > 0;

      if (hasVideo) {
        renderVideoPixels(smoothedBass, smoothedTreble);
      } else {
        renderFallbackGrid(smoothedBass, smoothedTreble, time, freqData);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [analyserRef, videoRef]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 h-full w-full" aria-hidden="true" />
      <video ref={videoRef} className="hidden" muted playsInline aria-hidden="true" />
    </>
  );
}
