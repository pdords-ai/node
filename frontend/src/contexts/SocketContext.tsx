import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContextType, SocketEvents } from '../types';
import { useAuth } from './AuthContext';

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:3000', {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket 연결됨');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket 연결 해제됨');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [token]);

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket) {
      socket.emit('leave_room', roomId);
    }
  };

  const sendMessage = (roomId: string, message: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (socket) {
      socket.emit('send_message', {
        roomId,
        message,
        type
      });
    }
  };

  const sendPrivateMessage = (targetUserId: string, message: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (socket) {
      socket.emit('send_private_message', {
        targetUserId,
        message,
        type
      });
    }
  };

  const value: SocketContextType = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendPrivateMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket은 SocketProvider 내에서 사용되어야 합니다.');
  }
  return context;
};
