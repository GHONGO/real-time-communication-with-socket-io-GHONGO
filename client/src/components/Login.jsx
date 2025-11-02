import { useState, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import './Login.css';

function Login({ onLogin, isConnected }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { connect, socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Auto-connect on mount
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      // Connection successful
      console.log('Connected to server');
    };

    const handleError = ({ message }) => {
      setError(message);
    };

    const handleConnectError = (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to server. Please ensure the server is running on port 5000.');
    };

    socket.on('connect', handleConnect);
    socket.on('error', handleError);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('error', handleError);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    // Connect first
    connect({ username: username.trim(), room: 'general' });
    
    // Wait for connection, then emit join
    if (socket.connected) {
      socket.emit('user_join', { username: username.trim(), room: 'general' });
      onLogin(username.trim());
    } else {
      socket.once('connect', () => {
        socket.emit('user_join', { username: username.trim(), room: 'general' });
        onLogin(username.trim());
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>💬 Chat Application</h1>
        <p className="login-subtitle">Real-time communication with Socket.io</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Enter your username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              maxLength={20}
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button" disabled={!isConnected}>
            {isConnected ? 'Join Chat' : 'Connecting...'}
          </button>
        </form>
        
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>
    </div>
  );
}

export default Login;

