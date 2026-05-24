import { useEffect, useRef } from 'react';
import {
  ACTIVITY_KEY,
  getIdleTimeoutMs,
  getLastActivityAt,
  touchSessionActivity,
} from '../utils/sessionActivity.js';

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

const CHECK_INTERVAL_MS = 15_000;

/**
 * Logs the user out after a period without input.
 * Syncs last-activity across tabs via sessionStorage/localStorage.
 */
export function useIdleTimeout({ enabled, onIdle }) {
  const onIdleRef = useRef(onIdle);
  const firedRef = useRef(false);
  onIdleRef.current = onIdle;

  useEffect(() => {
    firedRef.current = false;
  }, [enabled]);

  useEffect(() => {
    const idleMs = getIdleTimeoutMs();
    if (!enabled || !idleMs) return;

    const handleActivity = () => touchSessionActivity();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    const checkIdle = () => {
      if (firedRef.current) return;
      const lastActive = getLastActivityAt();
      if (lastActive != null && Date.now() - lastActive >= idleMs) {
        firedRef.current = true;
        onIdleRef.current?.();
      }
    };

    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS);

    const onStorage = (event) => {
      if (event.key === ACTIVITY_KEY || event.key === 'userInfo') {
        checkIdle();
      }
    };
    window.addEventListener('storage', onStorage);

    checkIdle();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.clearInterval(intervalId);
      window.removeEventListener('storage', onStorage);
    };
  }, [enabled]);
}
