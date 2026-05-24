/** Callback registry so api interceptors can invalidate session without importing AuthContext. */
let onSessionExpired = null;

export function setOnSessionExpired(handler) {
  onSessionExpired = handler;
}

export function notifySessionExpired(reason = 'expired') {
  if (typeof onSessionExpired === 'function') {
    onSessionExpired(reason);
  }
}
