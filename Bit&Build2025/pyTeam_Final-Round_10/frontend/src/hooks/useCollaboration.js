import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for real-time collaboration via WebSocket
 * Handles cursor sharing, workflow updates, and chat messages
 */
export const useCollaboration = (workflowId, userInfo) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const cursorThrottleRef = useRef({});
  const messageIdsRef = useRef(new Set()); // Track seen message IDs

  const connect = useCallback(() => {
    if (!workflowId || !userInfo) return;

    const wsUrl = `ws://localhost:8000/ws/collaborate/${workflowId}?user_id=${userInfo.user_id}&username=${encodeURIComponent(userInfo.username)}&color=${encodeURIComponent(userInfo.color)}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket connected for collaboration');
        setIsConnected(true);
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        ws.pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        console.log('📨 WebSocket message received:', data.type, data);
        
        switch (data.type) {
          case 'active_users':
            setActiveUsers(data.users);
            break;
          
          case 'user_joined':
            setActiveUsers(prev => {
              // Check if user already exists
              if (prev.find(u => u.user_id === data.user.user_id)) {
                return prev;
              }
              return [...prev, data.user];
            });
            console.log(`👋 ${data.user.username} joined the workflow`);
            break;
          
          case 'user_left':
            setActiveUsers(prev => prev.filter(u => u.user_id !== data.user_id));
            setCursors(prev => {
              const newCursors = { ...prev };
              delete newCursors[data.user_id];
              return newCursors;
            });
            console.log(`👋 ${data.username} left the workflow`);
            break;
          
          case 'cursor_move':
            // Throttle cursor updates per user
            const userId = data.user_id;
            const now = Date.now();
            const lastUpdate = cursorThrottleRef.current[userId] || 0;
            
            // Only update cursor if 50ms have passed since last update for this user
            if (now - lastUpdate > 50) {
              cursorThrottleRef.current[userId] = now;
              setCursors(prev => ({
                ...prev,
                [userId]: {
                  x: data.x,
                  y: data.y,
                  username: data.username,
                  color: data.color
                }
              }));
            }
            break;
          
          case 'workflow_update':
            // Emit custom event for workflow updates
            window.dispatchEvent(new CustomEvent('collaboration_workflow_update', { 
              detail: data 
            }));
            break;
          
          case 'chat_message':
            setChatMessages(prev => {
              // Create unique message ID
              const messageId = `${data.user_id}_${data.timestamp}_${data.message.substring(0, 20)}`;
              
              // Check if we've already seen this message ID
              if (messageIdsRef.current.has(messageId)) {
                console.log('⏭️ Skipping duplicate chat message (already seen)');
                return prev;
              }
              
              // Check if message already exists (additional safety)
              const exists = prev.some(msg => 
                msg.user_id === data.user_id && 
                msg.timestamp === data.timestamp && 
                msg.message === data.message
              );
              
              if (exists) {
                console.log('⏭️ Skipping duplicate chat message (already in state)');
                return prev;
              }
              
              // Mark this message ID as seen
              messageIdsRef.current.add(messageId);
              
              // Limit stored message IDs to prevent memory leak (keep last 1000)
              if (messageIdsRef.current.size > 1000) {
                const idsArray = Array.from(messageIdsRef.current);
                messageIdsRef.current = new Set(idsArray.slice(-1000));
              }
              
              return [...prev, {
                user_id: data.user_id,
                username: data.username,
                color: data.color,
                message: data.message,
                timestamp: data.timestamp,
                id: messageId
              }];
            });
            break;
          
          case 'pong':
            // Keep-alive response
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 3000);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [workflowId, userInfo]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendCursorPosition = useCallback((x, y) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_move',
        x,
        y
      }));
    }
  }, []);

  const sendWorkflowUpdate = useCallback((nodes, edges, action) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('📤 Sending workflow update:', { nodeCount: nodes?.length, edgeCount: edges?.length, action });
      
      // Debounce workflow updates
      if (wsRef.current.workflowUpdateTimeout) {
        clearTimeout(wsRef.current.workflowUpdateTimeout);
      }
      
      wsRef.current.workflowUpdateTimeout = setTimeout(() => {
        console.log('✉️ Actually sending workflow update to server');
        wsRef.current.send(JSON.stringify({
          type: 'workflow_update',
          nodes,
          edges,
          action
        }));
      }, 100);
    } else {
      console.warn('⚠️ Cannot send workflow update - WebSocket not open:', wsRef.current?.readyState);
    }
  }, []);

  const sendChatMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        message
      }));
    }
  }, []);

  return {
    isConnected,
    activeUsers,
    cursors,
    chatMessages,
    sendCursorPosition,
    sendWorkflowUpdate,
    sendChatMessage
  };
};
