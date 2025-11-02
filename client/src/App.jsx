import { useState } from 'react';
import { useSocket } from './socket/socket';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import PrivateChat from './components/PrivateChat';
import './index.css';

function App() {
  const [username, setUsername] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'private'
  const [privateChatWith, setPrivateChatWith] = useState(null);
  const { isConnected } = useSocket();

  const handleLogin = (user) => {
    setUsername(user);
  };

  const handleLogout = () => {
    setUsername(null);
    setCurrentView('main');
    setPrivateChatWith(null);
  };

  const openPrivateChat = (user) => {
    setPrivateChatWith(user);
    setCurrentView('private');
  };

  if (!username) {
    return <Login onLogin={handleLogin} isConnected={isConnected} />;
  }

  if (currentView === 'private') {
    return (
      <PrivateChat
        username={username}
        recipient={privateChatWith}
        onBack={() => setCurrentView('main')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ChatRoom
      username={username}
      onLogout={handleLogout}
      onOpenPrivateChat={openPrivateChat}
    />
  );
}

export default App;

