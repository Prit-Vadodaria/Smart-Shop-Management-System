import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { realtimeClient } from './realtimeClient.js';
import { AuthContext } from '../context/AuthContext.jsx';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [lastEvent, setLastEvent] = useState(null);
  const [connectionState, setConnectionState] = useState('idle');

  useEffect(() => {
    if (!user?.token) {
      setConnectionState('idle');
      return;
    }

    const unsubscribe = realtimeClient.subscribe((message) => {
      if (message.type === 'connection') {
        setConnectionState(message.status);
        return;
      }
      setLastEvent(message);
    });

    return unsubscribe;
  }, [user?.token]);

  const value = useMemo(() => ({ lastEvent, connectionState }), [lastEvent, connectionState]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => useContext(RealtimeContext);

