import React, { createContext, useEffect, useState, useContext, useRef } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) {
            // Clean up socket if user logs out
            if (socketRef.current) {
                console.log('User logged out, closing socket');
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Only create socket if it doesn't exist or is disconnected
        if (!socketRef.current || !socketRef.current.connected) {
            console.log('Creating new socket connection...');
            const newSocket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                forceNew: true
            });
            
            newSocket.on('connect', () => {
                console.log('✅ Socket Connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ Socket Disconnected. Reason:', reason);
                setIsConnected(false);
                
                // If disconnect was not intentional, try to reconnect
                if (reason === 'io server disconnect') {
                    // Server disconnected, reconnect manually
                    newSocket.connect();
                }
            });

            newSocket.on('reconnect', (attemptNumber) => {
                console.log('🔄 Socket Reconnected after', attemptNumber, 'attempts');
                setIsConnected(true);
            });

            newSocket.on('reconnect_attempt', (attemptNumber) => {
                console.log('🔄 Reconnection attempt', attemptNumber);
            });

            newSocket.on('reconnect_error', (error) => {
                console.error('❌ Reconnection error:', error);
            });

            newSocket.on('reconnect_failed', () => {
                console.error('❌ Reconnection failed after all attempts');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('❌ Socket Connection Error:', err.message);
                setIsConnected(false);
            });

            newSocket.on('test_event', (data) => {
                console.log('✅ Received test event from server:', data);
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            return () => {
                console.log('Cleaning up socket connection');
                if (socketRef.current && socketRef.current.connected) {
                    socketRef.current.close();
                }
                socketRef.current = null;
                setIsConnected(false);
            };
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
