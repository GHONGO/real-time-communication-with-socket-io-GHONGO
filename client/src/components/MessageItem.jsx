import { format } from 'date-fns';
import './MessageItem.css';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function MessageItem({ message, isOwn, onAddReaction }) {
  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  const handleReactionClick = (emoji) => {
    onAddReaction(message.id, emoji);
  };

  const renderMessageContent = () => {
    if (message.messageType === 'image' && message.fileData) {
      return (
        <div className="message-image">
          <img src={message.fileData} alt="Shared" />
        </div>
      );
    }
    if (message.messageType === 'file' && message.fileData) {
      return (
        <div className="message-file">
          <span>📎 File shared</span>
          <a href={message.fileData.url} download={message.fileData.name}>
            {message.fileData.name}
          </a>
        </div>
      );
    }
    return <p className="message-text">{message.message}</p>;
  };

  return (
    <div className={`message-item ${isOwn ? 'own-message' : ''}`}>
      {message.system ? (
        <div className="system-message">
          <span>{message.message}</span>
        </div>
      ) : (
        <>
          <div className="message-content">
            {!isOwn && (
              <span className="message-sender">{message.sender}</span>
            )}
            <div className="message-bubble">
              {renderMessageContent()}
              <span className="message-time">{formatTime(message.timestamp)}</span>
              {isOwn && message.readBy && Object.keys(message.readBy).length > 0 && (
                <span className="read-indicator">✓✓</span>
              )}
            </div>
          </div>
          
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="message-reactions">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  className="reaction-badge"
                  onClick={() => handleReactionClick(emoji)}
                  title={users.join(', ')}
                >
                  {emoji} {users.length}
                </button>
              ))}
            </div>
          )}
          
          {!message.reactions || Object.keys(message.reactions).length === 0 ? (
            <div className="reaction-picker">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  className="reaction-button"
                  onClick={() => handleReactionClick(emoji)}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <button
              className="add-reaction-button"
              onClick={() => {
                const firstEmoji = EMOJI_OPTIONS[0];
                handleReactionClick(firstEmoji);
              }}
            >
              + Add reaction
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default MessageItem;

