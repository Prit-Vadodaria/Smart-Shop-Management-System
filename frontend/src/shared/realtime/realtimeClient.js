import { getStoredSession } from '../utils/session.js';
import { API_ORIGIN } from '../services/api.js';

const listeners = new Set();
let controller = null;
let reconnectTimer = null;
let connected = false;
let lastEventId = null;

const emit = (event) => {
  for (const listener of listeners) {
    listener(event);
  }
};

const parseEventBlock = (block) => {
  const lines = block.split('\n');
  let event = 'message';
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return null;
  }
};

const connect = async () => {
  const session = getStoredSession();
  if (!session?.token) return;

  if (controller) {
    controller.abort();
  }

  controller = new AbortController();
  connected = false;

  try {
    const response = await fetch(`${API_ORIGIN}/api/realtime/stream`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Realtime stream failed with status ${response.status}`);
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    connected = true;
    emit({ type: 'connection', status: 'connected' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        const parsed = parseEventBlock(block);
        if (!parsed) continue;
        if (parsed.data?.eventId && parsed.data.eventId === lastEventId) continue;
        lastEventId = parsed.data?.eventId ?? lastEventId;
        emit({ type: 'event', event: parsed.event, data: parsed.data });
      }
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      emit({ type: 'connection', status: 'disconnected' });
      reconnectTimer = setTimeout(connect, 3000);
    }
  } finally {
    connected = false;
    controller = null;
  }
};

export const realtimeClient = {
  subscribe(listener) {
    listeners.add(listener);
    if (!connected && !controller) {
      connect();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && controller) {
        controller.abort();
      }
      if (listeners.size === 0 && reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
  },
  reconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    connect();
  },
};
