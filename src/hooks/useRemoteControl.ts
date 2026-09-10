import { useCallback, useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "../firebase";
import type { VisualPreset } from "../components/AudioVisualizer";
import type { Track } from "../tracks";

interface RemoteControlState {
  trackId: string | null;
  preset: VisualPreset | null;
}

interface UseRemoteControlResult {
  remoteTrackId: string | null;
  remotePreset: VisualPreset | null;
  publishTrackSelection: (track: Track | null) => void;
}

const CONTROL_PATH = "control";

/**
 * Mirrors the currently selected track + its live preset to Firebase
 * Realtime Database (when configured — no-ops otherwise) and reflects
 * remote changes made by the pilot app back into local state. This is
 * the only piece of the app that talks to Firebase directly.
 */
export function useRemoteControl(): UseRemoteControlResult {
  const [remoteTrackId, setRemoteTrackId] = useState<string | null>(null);
  const [remotePreset, setRemotePreset] = useState<VisualPreset | null>(null);

  useEffect(() => {
    if (!database) return;

    const controlRef = ref(database, CONTROL_PATH);
    const unsubscribe = onValue(controlRef, (snapshot) => {
      const value = snapshot.val() as RemoteControlState | null;
      setRemoteTrackId(value?.trackId ?? null);
      setRemotePreset(value?.preset ?? null);
    });

    return unsubscribe;
  }, []);

  const publishTrackSelection = useCallback((track: Track | null) => {
    if (!database) return;
    const state: RemoteControlState = {
      trackId: track?.id ?? null,
      preset: track?.preset ?? null,
    };
    void set(ref(database, CONTROL_PATH), state);
  }, []);

  return { remoteTrackId, remotePreset, publishTrackSelection };
}
