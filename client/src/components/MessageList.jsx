import { useEffect } from 'react';
import MessageItem from './MessageItem';
import './MessageList.css';

function MessageList({ messages, currentUser, onAddReaction, onMarkRead, messagesEndRef }) {
  useEffect(() => {
    // Mark messages as read when viewing
    messages.forEach(msg => {
      if (!msg.isPrivate && msg.sender !== currentUser && msg.readBy) {
        const isRead = msg.readBy[Object.keys(msg.readBy)[0]];
        if (!isRead) {
          onMarkRead(msg.id);
        }
      }
    });
  }, [messages, currentUser, onMarkRead]);

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.sender === currentUser}
            onAddReaction={onAddReaction}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;

