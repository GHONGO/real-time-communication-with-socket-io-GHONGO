import { useState, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import './Sidebar.css';

function Sidebar({ 
  rooms, 
  currentRoom, 
  users, 
  unreadCounts, 
  onRoomChange, 
  onOpenPrivateChat,
  onLogout,
  username,
  sidebarOpen,
  setSidebarOpen
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { socket } = useSocket();
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleSearchResults = (results) => {
      setSearchResults(results);
    };

    // Note: Server search is via API, not socket
    // For now, we'll do client-side search
    socket.on('search_results', handleSearchResults);

    return () => {
      socket.off('search_results', handleSearchResults);
    };
  }, [socket]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/search/${currentRoom}?q=${encodeURIComponent(searchQuery)}`);
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getUnreadCount = (room) => {
    if (!socket || !unreadCounts || !unreadCounts[room]) return 0;
    return unreadCounts[room][socket.id] || 0;
  };

  return (
    <>
      {!sidebarOpen && (
        <button 
          className="sidebar-toggle-button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Chat Rooms</h2>
        <button 
          className="close-sidebar"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <div className="sidebar-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">🔍</button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>Search Results</h4>
            {searchResults.map((msg) => (
              <div key={msg.id} className="search-result-item">
                <strong>{msg.sender}:</strong> {msg.message?.substring(0, 50)}...
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Rooms</h3>
        <div className="room-list">
          {rooms.map((room) => {
            const unread = getUnreadCount(room);
            return (
              <button
                key={room}
                className={`room-item ${room === currentRoom ? 'active' : ''}`}
                onClick={() => onRoomChange(room)}
              >
                <span>#{room}</span>
                {unread > 0 && <span className="unread-badge">{unread}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Online Users ({users.length})</h3>
        <div className="user-list">
          {users.map((user) => (
            <div key={user.id} className="user-item">
              <span className="user-avatar">{user.username[0].toUpperCase()}</span>
              <span className="user-name">
                {user.username}
                {user.username === username && ' (You)'}
              </span>
              <button
                className="private-chat-button"
                onClick={() => onOpenPrivateChat(user)}
                title="Start private chat"
                disabled={user.username === username}
              >
                💬
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="current-user">
          <span className="user-avatar">{username[0].toUpperCase()}</span>
          <span className="user-name">{username}</span>
        </div>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
      </div>
    </>
  );
}

export default Sidebar;

