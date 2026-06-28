import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../services/api-client';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    if (!user) return;

    const accessToken = getAccessToken();
    if (!accessToken) return;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/v1', '') || 'http://localhost:3001', {
      auth: { token: accessToken },
      path: '/socket.io',
    });

    socket.on('connect', () => {
      setIsConnected(true);
      // Fetch initial unread count on connect
      fetchNotifications(1, false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setIsConnected(false);
    });

    // Global notification listener — updates badge on every page
    socket.on('notification:new', (data: any) => {
      addNotification({
        _id: data.notificationId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: false,
        createdAt: data.createdAt,
      });
    });

    socketRef.current = socket;

    return () => {
      socket.off('notification:new');
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, addNotification, fetchNotifications]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
