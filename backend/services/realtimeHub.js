const clients = new Set();
let nextEventId = 1;

export const addRealtimeClient = (res) => {
  clients.add(res);

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('connected', { ok: true, eventId: `${Date.now()}-${nextEventId++}`, timestamp: Date.now() });

  return () => {
    clients.delete(res);
  };
};

export const publishRealtimeEvent = (event, data = {}) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify({ event, eventId: `${Date.now()}-${nextEventId++}`, ...data, timestamp: Date.now() })}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
};
