import { useEffect, useRef } from 'react';
import { useRealtime } from './RealtimeProvider.jsx';

export const useRealtimeEvent = (matcher, handler) => {
  const { lastEvent } = useRealtime() || {};
  const handlerRef = useRef(handler);
  const lastProcessedRef = useRef(null);
  handlerRef.current = handler;

  useEffect(() => {
    if (!lastEvent || typeof handlerRef.current !== 'function') return;
    const eventKey = lastEvent.data?.timestamp ?? `${lastEvent.event}:${JSON.stringify(lastEvent.data || {})}`;
    if (lastProcessedRef.current === eventKey) return;
    const match = typeof matcher === 'function'
      ? matcher(lastEvent)
      : Array.isArray(matcher)
        ? matcher.includes(lastEvent.event)
        : true;
    if (match) {
      lastProcessedRef.current = eventKey;
      handlerRef.current(lastEvent);
    }
  }, [lastEvent?.data?.timestamp, lastEvent?.event, matcher]);
};
