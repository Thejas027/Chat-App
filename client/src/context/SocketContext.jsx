import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import PropTypes from 'prop-types';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [latency, setLatency] = useState(null);
  const pingInterval = useRef(null);
  const { user, token } = useAuth();

  const [userStatuses, setUserStatuses] = useState({}); // Track online/offline and last seen
  
  useEffect(() => {
    if (!user || !token) {
      // If no user is authenticated, disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token,
        userId: user._id
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectionAttempts(0);
      
      // Start measuring latency
      startPingInterval(newSocket);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Some disconnect reasons should trigger immediate reconnection
      if (reason === 'io server disconnect') {
        // Server intentionally disconnected us, need to reconnect manually
        newSocket.connect();
      }
      // Other reasons like 'transport close' or 'ping timeout' will automatically attempt to reconnect
    });
    
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setReconnectionAttempts(attemptNumber);
      console.log(`Socket reconnection attempt ${attemptNumber}`);
    });

    newSocket.on('reconnect', () => {
      console.log('Socket reconnected successfully');
      setIsConnected(true);
      setConnectionError(null);
      setReconnectionAttempts(0);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });
    
    // Handle user status change events
    newSocket.on('user_status_changed', ({ userId, isOnline, lastSeen }) => {
      setUserStatuses(prev => ({
        ...prev,
        [userId]: {
          isOnline,
          lastSeen
        }
      }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      newSocket.disconnect();
    };
  }, [user, token]);

  // Function to measure latency using ping/pong
  const startPingInterval = (socket) => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
    }
    
    pingInterval.current = setInterval(() => {
      const start = Date.now();
      
      // Send ping and wait for pong
      socket.emit('ping_health', {}, () => {
        const latencyValue = Date.now() - start;
        setLatency(latencyValue);
      });
    }, 15000); // Check every 15 seconds
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    reconnectionAttempts,
    latency,
    userStatuses,
    getUserStatus: (userId) => userStatuses[userId] || { isOnline: false, lastSeen: null },
    getConnectionStatus: () => {
      if (connectionError) return 'error';
      if (isConnected) return latency ? `connected (${latency}ms)` : 'connected';
      if (reconnectionAttempts > 0) return `reconnecting (${reconnectionAttempts})`;
      if (socket && !isConnected) return 'connecting';
      return 'disconnected';
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default SocketContext;
