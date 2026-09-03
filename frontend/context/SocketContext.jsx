import { createContext, useContext } from 'react';

// Phase 0 placeholder. Real-time Socket.IO (chat + notifications) is wired in Phase 3.
// The Node backend already exposes a Socket.IO server (proxied through :8001).
const SocketContext = createContext({ socket: null, connected: false });

export function SocketProvider({ children }) {
  return (
    <SocketContext.Provider value={{ socket: null, connected: false }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
