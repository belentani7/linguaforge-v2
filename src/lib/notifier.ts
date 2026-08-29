type WebkitWindow = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

function playCompletionSound() {
  const AudioContextCtor =
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!AudioContextCtor) return;
  const audioContext = new AudioContextCtor();
  const playTone = (frequency: number, start: number, duration: number) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startAt = audioContext.currentTime + start;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.08, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
  };
  playTone(440, 0, 0.15);
  playTone(880, 0.12, 0.3);
  window.setTimeout(() => void audioContext.close(), 600);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied")
    return (await Notification.requestPermission()) === "granted";
  return false;
}

export function notifyTaskComplete(
  title = "Tarea completada",
  body = "El proceso ha finalizado.",
) {
  try {
    playCompletionSound();
  } catch {
    // La notificación visual continúa aunque el navegador bloquee el audio.
  }
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, silent: true });
  }
}
