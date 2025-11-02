import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../socket/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Sidebar from './Sidebar';
import NotificationHandler from './NotificationHandler';
import './ChatRoom.css';

function ChatRoom({ username, onLogout, onOpenPrivateChat }) {
  const [currentRoom, setCurrentRoom] = useState('general');
  const [roomMessages, setRoomMessages] = useState({});
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { socket, isConnected, connect, disconnect } = useSocket();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      connect({ username, room: currentRoom });
    }

    return () => {
      // Don't disconnect on unmount - let user logout handle it
    };
  }, [username, socket, connect]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomMessages = ({ room, messages }) => {
      setRoomMessages(prev => ({ ...prev, [room]: messages || [] }));
    };

    const handleReceiveMessage = (message) => {
      setRoomMessages(prev => ({
        ...prev,
        [message.room]: [...(prev[message.room] || []), message]
      }));
      scrollToBottom();
    };

    const handleRoomList = (roomList) => {
      setRooms(roomList);
    };

    const handleUserList = (userList) => {
      setUsers(userList);
    };

    const handleTypingUsers = (users) => {
      setTypingUsers(users);
    };

    const handleRoomJoined = ({ room }) => {
      setCurrentRoom(room);
    };

    const handleUnreadCounts = (counts) => {
      setUnreadCounts(counts);
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      setRoomMessages(prev => {
        const updated = { ...prev };
        const roomMsgs = updated[currentRoom] || [];
        const msgIndex = roomMsgs.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          roomMsgs[msgIndex] = { ...roomMsgs[msgIndex], reactions };
          updated[currentRoom] = [...roomMsgs];
        }
        return updated;
      });
    };

    const handleMessageRead = ({ messageId, readBy }) => {
      setRoomMessages(prev => {
        const updated = { ...prev };
        const roomMsgs = updated[currentRoom] || [];
        const msgIndex = roomMsgs.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          roomMsgs[msgIndex] = { ...roomMsgs[msgIndex], readBy };
          updated[currentRoom] = [...roomMsgs];
        }
        return updated;
      });
    };

    socket.on('room_messages', handleRoomMessages);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('room_list', handleRoomList);
    socket.on('user_list', handleUserList);
    socket.on('typing_users', handleTypingUsers);
    socket.on('room_joined', handleRoomJoined);
    socket.on('unread_counts', handleUnreadCounts);
    socket.on('message_reaction', handleMessageReaction);
    socket.on('message_read', handleMessageRead);

    socket.emit('user_join', { username, room: currentRoom });

    return () => {
      socket.off('room_messages', handleRoomMessages);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('room_list', handleRoomList);
      socket.off('user_list', handleUserList);
      socket.off('typing_users', handleTypingUsers);
      socket.off('room_joined', handleRoomJoined);
      socket.off('unread_counts', handleUnreadCounts);
      socket.off('message_reaction', handleMessageReaction);
      socket.off('message_read', handleMessageRead);
    };
  }, [socket, currentRoom, username]);

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages[currentRoom]]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRoomChange = (room) => {
    if (room !== currentRoom) {
      socket.emit('join_room', { room });
      setCurrentRoom(room);
    }
  };

  const handleSendMessage = (message, messageType = 'text', fileData = null) => {
    socket.emit('send_message', {
      message,
      room: currentRoom,
      messageType,
      fileData
    });
  };

  const handleTyping = (isTyping) => {
    socket.emit('typing', { isTyping, room: currentRoom });
  };

  const handleAddReaction = (messageId, emoji) => {
    socket.emit('add_reaction', { messageId, emoji, room: currentRoom });
  };

  const handleMarkRead = (messageId) => {
    socket.emit('mark_read', { messageId, room: currentRoom });
  };

  return (
    <div className="chat-room">
      <NotificationHandler socket={socket} currentRoom={currentRoom} username={username} />
      
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        users={users}
        unreadCounts={unreadCounts}
        onRoomChange={handleRoomChange}
        onOpenPrivateChat={onOpenPrivateChat}
        onLogout={onLogout}
        username={username}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="chat-main">
        <div className="chat-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="room-info">
            <h2>#{currentRoom}</h2>
            <span className="room-user-count">{users.length} user{users.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="connection-badge">
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            {isConnected ? 'Online' : 'Offline'}
          </div>
        </div>

        <MessageList
          messages={roomMessages[currentRoom] || []}
          currentUser={username}
          onAddReaction={handleAddReaction}
          onMarkRead={handleMarkRead}
          messagesEndRef={messagesEndRef}
        />

        <div className="typing-indicator">
          {typingUsers.length > 0 && (
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          )}
        </div>

        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}

export default ChatRoom;

