import { useCallback, useEffect, useState } from "react";
import { onValue, ref, update } from "firebase/database";
import { database } from "../firebase";
import { DEFAULT_VISUAL_PRESET, type VisualPreset } from "../components/AudioVisualizer";
import type { Track } from "../tracks";

interface RemoteControlState {
  trackId: string | null;
  preset: Partial<VisualPreset> | null;
}

interface UseRemoteControlResult {
  remoteTrackId: string | null;
  remotePreset: VisualPreset;
  publishTrackSelection: (track: Track | null) => void;
}

const CONTROL_PATH = "control";

/**
 * Mirrors the currently selected track to Firebase Realtime Database
 * (when configured — no-ops otherwise) and reflects remote changes made
 * by the pilot app back into local state. The preset is a single global
 * config shared across every track — picking a track never touches it,
 * only the pilot's sliders do (see pixel-remote's useRemoteControl).
 */
export function useRemoteControl(): UseRemoteControlResult {
  const [remoteTrackId, setRemoteTrackId] = useState<string | null>(null);
  const [remotePreset, setRemotePreset] = useState<VisualPreset>(DEFAULT_VISUAL_PRESET);

  useEffect(() => {
    if (!database) return;

    const controlRef = ref(database, CONTROL_PATH);
    const unsubscribe = onValue(controlRef, (snapshot) => {
      const value = snapshot.val() as RemoteControlState | null;
      setRemoteTrackId(value?.trackId ?? null);
      // Firebase only stores whichever fields have ever been patched (a
      // lone slider drag writes just that one key) — merge onto the
      // defaults so every field is always defined, never NaN downstream
      setRemotePreset({ ...DEFAULT_VISUAL_PRESET, ...value?.preset });
    });

    return unsubscribe;
  }, []);

  const publishTrackSelection = useCallback((track: Track | null) => {
    if (!database) return;
    // patch only trackId — the shared preset is left untouched
    void update(ref(database, CONTROL_PATH), { trackId: track?.id ?? null });
  }, []);

  return { remoteTrackId, remotePreset, publishTrackSelection };
}
