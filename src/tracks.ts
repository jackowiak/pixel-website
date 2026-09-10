export interface Track {
  id: string;
  url: string;
  label: string;
}

export const TRACKS: Track[] = [
  { id: "redhed", url: "/tracks/redhed.m4a", label: "Redhed" },
  { id: "response", url: "/tracks/response.m4a", label: "Response" },
  { id: "revolut", url: "/tracks/revolut.m4a", label: "Revolut" },
  { id: "slut", url: "/tracks/slut.m4a", label: "Slut" },
  {
    id: "late-stage-of-summa",
    url: "/tracks/latestageofsumma1.mp3",
    label: "Late Stage Of Summa",
  },
  { id: "boner2-74bpm", url: "/tracks/boner2_74bpm.m4a", label: "Boner 2 (74 BPM)" },
];

export function findTrackById(id: string | null | undefined): Track | undefined {
  if (!id) return undefined;
  return TRACKS.find((track) => track.id === id);
}
