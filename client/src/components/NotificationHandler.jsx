import { useEffect, useRef } from 'react';

function NotificationHandler({ socket, currentRoom, username }) {
  const notificationSoundRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Create audio element for sound notifications
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLYiTcIGWi77+eeTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Ik3CBlou+/nnk0QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
    
    const handleNewMessageNotification = ({ room, sender, message, isPrivate, unreadCount }) => {
      // Don't notify if it's from current room or from self
      if (isPrivate && sender === username) return;
      if (!isPrivate && room === currentRoom) return;

      // Sound notification
      try {
        notificationSoundRef.current.play().catch(() => {
          // Ignore errors (user may have disabled audio)
        });
      } catch (error) {
        // Ignore audio errors
      }

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = isPrivate ? `Private message from ${sender}` : `New message in #${room}`;
        const body = message || 'You have a new message';
        
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `${room}_${sender}`,
        });
      }
    };

    socket.on('new_message_notification', handleNewMessageNotification);

    return () => {
      socket.off('new_message_notification', handleNewMessageNotification);
    };
  }, [socket, currentRoom, username]);

  return null;
}

export default NotificationHandler;

