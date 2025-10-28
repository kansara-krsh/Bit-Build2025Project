import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Users, MessageCircle, Minimize2, Maximize2, UserPlus } from 'lucide-react';

function CollaborationChat({ chatMessages, activeUsers, sendChatMessage, currentUser, isConnected, onOpenInviteModal, workflowId }) {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Deduplicate active users by user_id
  const uniqueActiveUsers = activeUsers.reduce((acc, user) => {
    if (!acc.find(u => u.user_id === user.user_id)) {
      acc.push(user);
    }
    return acc;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [chatMessages, isOpen, isMinimized]);

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && sendChatMessage) {
      sendChatMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 flex items-center gap-2"
        title="Open collaboration chat"
      >
        <MessageCircle className="w-6 h-6" />
        {chatMessages.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {chatMessages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`fixed right-6 z-50 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-300 ${
        isMinimized ? 'bottom-6 w-80' : 'bottom-6 w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white" />
          <h3 className="text-white font-bold">Collaboration Chat</h3>
          {isConnected && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-100">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Active Users */}
          <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Active Users ({uniqueActiveUsers.length})</span>
              </div>
              {onOpenInviteModal && workflowId && currentUser && (
                <button
                  onClick={() => onOpenInviteModal(workflowId, currentUser)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                  title="Invite collaborators"
                >
                  <UserPlus className="w-3 h-3" />
                  Invite
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {uniqueActiveUsers.map(user => (
                <div 
                  key={user.user_id}
                  className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded-full text-xs"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="text-gray-200">{user.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: '400px' }}>
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start chatting with your collaborators!</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isOwnMessage = msg.user_id === currentUser?.user_id;
                // Use unique key combining user_id, timestamp, and message
                const messageKey = msg.id || `${msg.user_id}_${msg.timestamp}_${msg.message.substring(0, 20)}`;
                
                return (
                  <div 
                    key={messageKey}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isOwnMessage && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: msg.color }}
                          ></div>
                        )}
                        <span className="text-xs text-gray-400">
                          {isOwnMessage ? 'You' : msg.username} • {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div 
                        className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!message.trim() || !isConnected}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {!isConnected && (
              <div className="text-xs text-center mt-2 space-y-1">
                <p className="text-yellow-400">⚠️ Collaboration offline</p>
                <p className="text-gray-500">Chat will be available when connected</p>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}

export default CollaborationChat;
