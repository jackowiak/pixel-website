import type { VisualPreset } from "./components/AudioVisualizer";

export interface Track {
  id: string;
  url: string;
  label: string;
  preset: VisualPreset;
}

export const TRACKS: Track[] = [
  {
    id: "redhed",
    url: "/tracks/redhed.m4a",
    label: "Redhed",
    // hot & blown-out: chunky pixels, strong bass-driven brightness
    preset: { baseCols: 100, minCols: 14, contrastMul: 1.1, brightnessBias: 20, jitterMul: 1.1 },
  },
  {
    id: "response",
    url: "/tracks/response.m4a",
    label: "Response",
    // fine detail, crisp high-contrast snap on the highs
    preset: { baseCols: 132, minCols: 20, contrastMul: 1.7, brightnessBias: -5, jitterMul: 0.8 },
  },
  {
    id: "revolut",
    url: "/tracks/revolut.m4a",
    label: "Revolut",
    // moody and dark, stays blue/black longer before flashing bright
    preset: { baseCols: 105, minCols: 18, contrastMul: 0.85, brightnessBias: -25, jitterMul: 0.9 },
  },
  {
    id: "slut",
    url: "/tracks/slut.m4a",
    label: "Slut",
    // washed out and soft, leans bright even at rest
    preset: { baseCols: 95, minCols: 22, contrastMul: 0.7, brightnessBias: 30, jitterMul: 0.7 },
  },
  {
    id: "late-stage-of-summa",
    url: "/tracks/latestageofsumma1.mp3",
    label: "Late Stage Of Summa",
    // glitchy, jittery, unstable
    preset: { baseCols: 116, minCols: 16, contrastMul: 1.3, brightnessBias: 5, jitterMul: 1.7 },
  },
  {
    id: "boner2-74bpm",
    url: "/tracks/boner2_74bpm.m4a",
    label: "Boner 2 (74 BPM)",
    // coarse and blocky even without much bass
    preset: { baseCols: 68, minCols: 10, contrastMul: 1.2, brightnessBias: 10, jitterMul: 1.3 },
  },
];

export function findTrackById(id: string | null | undefined): Track | undefined {
  if (!id) return undefined;
  return TRACKS.find((track) => track.id === id);
}
