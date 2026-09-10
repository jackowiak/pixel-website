# SLUT SESSION

Real-time camera pixelation, driven by music. Pick a track from the beat
tape and your webcam feed gets pixelated live into a black / blue / red /
white palette, reacting to the track's bass and treble as it plays.

## Tech stack

- **React 19** + **TypeScript** — UI and app state
- **Vite** — dev server and build tooling
- **Tailwind CSS v4** — styling
- **Web Audio API** (`AudioContext`, `AnalyserNode`) — decodes and analyses
  track frequency data (bass/treble energy, with auto-gain normalization
  so the effect stays lively on quiet tracks too)
- **MediaDevices getUserMedia** — webcam access
- **Canvas 2D API** — the pixelation pipeline itself: the video frame is
  downsampled to a small offscreen canvas, color-quantized per pixel
  based on the audio-reactive palette thresholds, then upscaled to the
  full screen with `imageSmoothingEnabled = false` for hard pixel edges
- **Netlify** — hosting/deploy (`netlify.toml`), auto-deploys on push to `main`
- **Firebase Realtime Database** (optional) — live sync with the
  [pixel-remote](https://github.com/jackowiak/pixel-remote) pilot app, so
  the pixelation parameters can be tweaked live from another device

No animation, canvas, or audio-visualization libraries — the rendering
loop, pixelation, and audio analysis are all hand-rolled on top of native
browser APIs.

## Project structure

- `src/hooks/useCameraStream.ts` — isolates camera `getUserMedia` access
- `src/hooks/useAudioAnalyser.ts` — isolates Web Audio playback/analysis
  of a track fetched from `public/tracks/`
- `src/hooks/useRemoteControl.ts` — mirrors the current track + its live
  preset to Firebase Realtime Database (no-ops if unconfigured)
- `src/tracks.ts` — the track list (id, audio URL, label, default
  `VisualPreset`), shared by the picker UI and the remote-control hook
- `src/components/AudioVisualizer.tsx` — the canvas render loop
  (pixelation + color quantization + per-track `VisualPreset`s)
- `src/components/OverlayUI.tsx` — the track-pad picker and status UI

## Running locally

```bash
npm install
npm run dev
```

Remote control is optional. Without a `.env`, the app works exactly as
before (local track picking only). To enable it:

1. In the [Firebase console](https://console.firebase.google.com): Add
   project → Build → Realtime Database → Create Database (any region,
   test mode) → in the **Rules** tab set:
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
2. Project settings → General → Your apps → Add app → Web → register →
   copy the `firebaseConfig` values.
3. Copy `.env.example` to `.env` and fill in those values.

The `pixel-remote` pilot app must point at the **same** Firebase project
(same `.env` values) to share the live state.

## Build

```bash
npm run build
```
