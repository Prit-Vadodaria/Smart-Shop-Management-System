const SESSION_KEY = 'userInfo';

/** Decode JWT `exp` claim (seconds) to milliseconds, or null if unavailable. */
export function getTokenExpiryMs(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  } catch {
    // ignore malformed token
  }
  return null;
}

/** True when token is missing or past expiry (30s clock skew buffer). */
export function isTokenExpired(token) {
  const expMs = getTokenExpiryMs(token);
  if (!expMs) return false;
  return Date.now() >= expMs - 30_000;
}

function readFromStorage(storage) {
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(SESSION_KEY);
    return null;
  }
}

/** Read persisted session from localStorage (remember me) or sessionStorage (tab session). */
export function getStoredSession() {
  const fromLocal = readFromStorage(localStorage);
  if (fromLocal) {
    return { ...fromLocal, rememberMe: fromLocal.rememberMe !== false };
  }
  const fromSession = readFromStorage(sessionStorage);
  if (fromSession) {
    return { ...fromSession, rememberMe: false };
  }
  return null;
}

export function getToken() {
  return getStoredSession()?.token ?? null;
}

/** Persist session; rememberMe=true uses localStorage, false uses sessionStorage (cleared when tab closes). */
export function persistSession(userInfo, rememberMe = true) {
  const payload = { ...userInfo };
  delete payload.rememberMe;

  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify({ ...payload, rememberMe }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export { SESSION_KEY };
