import { useState, useRef, useEffect } from 'react';
import './MessageInput.css';

function MessageInput({ onSendMessage, onTyping, disabled }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      // Handle image
      const reader = new FileReader();
      reader.onloadend = () => {
        onSendMessage('Shared an image', 'image', reader.result);
        setShowFileMenu(false);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle other files (simplified - in production, upload to server)
      onSendMessage(`Shared file: ${file.name}`, 'file', {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      });
      setShowFileMenu(false);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="file-menu-container">
          <button
            type="button"
            className="file-button"
            onClick={() => setShowFileMenu(!showFileMenu)}
            disabled={disabled}
            aria-label="Attach file"
          >
            📎
          </button>
          {showFileMenu && (
            <div className="file-menu">
              <label className="file-menu-item">
                📷 Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
              </label>
              <label className="file-menu-item">
                📄 File
                <input
                  type="file"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
        </div>
        
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? 'Connecting...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          className="message-textarea"
        />
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="send-button"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

export default MessageInput;

