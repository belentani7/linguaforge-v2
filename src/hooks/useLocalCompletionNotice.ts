import { useCallback, useEffect, useRef, useState } from "react";

type NoticePermission = NotificationPermission | "unsupported";

const STORAGE_KEY = "linguaforge.local-notices";

export function useLocalCompletionNotice() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [permission, setPermission] = useState<NoticePermission>("unsupported");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(window.Notification.permission);
    setEnabled(
      window.localStorage.getItem(STORAGE_KEY) === "enabled" &&
        window.Notification.permission === "granted",
    );
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window))
      return false;
    const nextPermission =
      window.Notification.permission === "granted"
        ? "granted"
        : await window.Notification.requestPermission();
    setPermission(nextPermission);
    const nextEnabled = nextPermission === "granted";
    setEnabled(nextEnabled);
    window.localStorage.setItem(
      STORAGE_KEY,
      nextEnabled ? "enabled" : "disabled",
    );
    if (nextEnabled && "AudioContext" in window) {
      try {
        const context = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = context;
        await context.resume();
      } catch {
        // Some browsers require a later user gesture; the visual notice remains available.
      }
    }
    return nextEnabled;
  }, []);

  const disable = useCallback(() => {
    if (typeof window !== "undefined")
      window.localStorage.setItem(STORAGE_KEY, "disabled");
    setEnabled(false);
  }, []);

  const notifyCompletion = useCallback(
    (title: string, body: string) => {
      if (!enabled || permission !== "granted" || typeof window === "undefined")
        return;
      try {
        new window.Notification(title, { body });
      } catch {
        // Permission can change between render and completion; do not interrupt learning.
      }
      try {
        const context = audioContextRef.current;
        if (!context) return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.08,
          context.currentTime + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.16,
        );
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.17);
      } catch {
        // Audio is best-effort and never blocks a completed action.
      }
    },
    [enabled, permission],
  );

  return {
    enabled,
    permission,
    supported: permission !== "unsupported",
    requestPermission,
    disable,
    notifyCompletion,
  };
}
