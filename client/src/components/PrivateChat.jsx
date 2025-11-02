import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../socket/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './PrivateChat.css';

function PrivateChat({ username, recipient, onBack, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = (message) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      scrollToBottom();
    };

    socket.on('private_message', handlePrivateMessage);

    return () => {
      socket.off('private_message', handlePrivateMessage);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (message, messageType = 'text', fileData = null) => {
    socket.emit('private_message', {
      to: recipient.username,
      message,
      messageType,
      fileData
    });
  };

  const handleTyping = (typing) => {
    setIsTyping(typing);
    // Private typing indicators could be implemented here
  };

  return (
    <div className="private-chat">
      <div className="private-chat-header">
        <button onClick={onBack} className="back-button">← Back</button>
        <div className="recipient-info">
          <span className="recipient-avatar">{recipient.username[0].toUpperCase()}</span>
          <div>
            <h3>{recipient.username}</h3>
            <span className="status-text">Private chat</span>
          </div>
        </div>
        <button onClick={onLogout} className="logout-button-small">Logout</button>
      </div>

      <MessageList
        messages={messages.filter(m => 
          (m.sender === username && m.recipientId === recipient.id) ||
          (m.sender === recipient.username && m.senderId === recipient.id)
        )}
        currentUser={username}
        messagesEndRef={messagesEndRef}
      />

      <div className="typing-indicator">
        {isTyping && <span>{recipient.username} is typing...</span>}
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
}

export default PrivateChat;

