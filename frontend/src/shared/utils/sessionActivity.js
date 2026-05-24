import { getStoredSession } from './session.js';

export const ACTIVITY_KEY = 'sessionLastActivity';
const ACTIVITY_THROTTLE_MS = 5_000;

let lastTouchAt = 0;

function getActivityStorage() {
  const stored = getStoredSession();
  if (!stored) return null;
  return stored.rememberMe !== false ? localStorage : sessionStorage;
}

/** Mark the current session as active (throttled). Used for idle-timeout tracking. */
export function touchSessionActivity() {
  const now = Date.now();
  if (now - lastTouchAt < ACTIVITY_THROTTLE_MS) return;

  const storage = getActivityStorage();
  if (!storage) return;

  lastTouchAt = now;
  storage.setItem(ACTIVITY_KEY, String(now));
}

export function setSessionActivityNow() {
  lastTouchAt = 0;
  touchSessionActivity();
}

export function getLastActivityAt() {
  const storage = getActivityStorage();
  if (!storage) return null;

  const raw = storage.getItem(ACTIVITY_KEY);
  if (!raw) return Date.now();

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function clearSessionActivity() {
  localStorage.removeItem(ACTIVITY_KEY);
  sessionStorage.removeItem(ACTIVITY_KEY);
  lastTouchAt = 0;
}

/** Idle timeout in ms; null when disabled (VITE_SESSION_IDLE_MINUTES <= 0). */
export function getIdleTimeoutMs() {
  const minutes = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES ?? 30);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return minutes * 60 * 1000;
}
