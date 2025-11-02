// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CLIENT_URL 
        ? [process.env.CLIENT_URL] 
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CLIENT_URL 
      ? [process.env.CLIENT_URL] 
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and messages
const users = {}; // { socketId: { username, id, currentRoom, lastSeen } }
const messages = {}; // { roomId: [messages] }
const typingUsers = {}; // { roomId: { socketId: username } }
const rooms = ['general', 'random', 'tech', 'gaming']; // Default rooms
const reactions = {}; // { messageId: { emoji: [usernames] } }
const unreadCounts = {}; // { roomId: { socketId: count } }
const readReceipts = {}; // { messageId: { socketId: timestamp } }

// Initialize messages for each room
rooms.forEach(room => {
  messages[room] = [];
});

// Initialize unread counts
rooms.forEach(room => {
  unreadCounts[room] = {};
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', ({ username, room = 'general' }) => {
    if (!username || username.trim() === '') {
      socket.emit('error', { message: 'Username is required' });
      return;
    }

    // Check if username is already taken
    const usernameTaken = Object.values(users).some(u => u.username === username.trim());
    if (usernameTaken) {
      socket.emit('error', { message: 'Username is already taken' });
      return;
    }

    // Join default room
    socket.join(room);
    users[socket.id] = { 
      username: username.trim(), 
      id: socket.id, 
      currentRoom: room,
      lastSeen: new Date().toISOString()
    };

    // Initialize unread counts for this user
    rooms.forEach(r => {
      if (!unreadCounts[r][socket.id]) {
        unreadCounts[r][socket.id] = 0;
      }
    });

    // Emit current room messages
    socket.emit('room_messages', { room, messages: messages[room] || [] });
    
    // Emit room list
    socket.emit('room_list', rooms);
    
    // Notify others in the room
    socket.to(room).emit('user_joined', { username: users[socket.id].username, id: socket.id, room });
    
    // Emit user list for the room
    const roomUsers = getRoomUsers(room);
    io.to(room).emit('user_list', roomUsers);
    
    console.log(`${username} joined room: ${room}`);
  });

  // Handle joining a room
  socket.on('join_room', ({ room }) => {
    if (!users[socket.id]) return;

    const previousRoom = users[socket.id].currentRoom;
    
    if (previousRoom && previousRoom !== room) {
      socket.leave(previousRoom);
      socket.to(previousRoom).emit('user_left_room', { 
        username: users[socket.id].username, 
        id: socket.id 
      });
      
      // Update unread count when leaving room
      if (typingUsers[previousRoom] && typingUsers[previousRoom][socket.id]) {
        delete typingUsers[previousRoom][socket.id];
        io.to(previousRoom).emit('typing_users', Object.values(typingUsers[previousRoom] || {}));
      }
    }

    socket.join(room);
    users[socket.id].currentRoom = room;
    
    // Reset unread count for this room
    unreadCounts[room][socket.id] = 0;
    
    // Emit messages for the new room
    socket.emit('room_messages', { room, messages: messages[room] || [] });
    
    // Notify others in the new room
    socket.to(room).emit('user_joined_room', { 
      username: users[socket.id].username, 
      id: socket.id 
    });
    
    // Emit user list for the room
    const roomUsers = getRoomUsers(room);
    io.to(room).emit('user_list', roomUsers);
    
    socket.emit('room_joined', { room });
    socket.emit('unread_counts', unreadCounts[room]);
    
    console.log(`${users[socket.id].username} joined room: ${room}`);
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    if (!users[socket.id]) return;

    const room = messageData.room || users[socket.id].currentRoom || 'general';
    const messageId = uuidv4();
    
    const message = {
      ...messageData,
      id: messageId,
      sender: users[socket.id].username,
      senderId: socket.id,
      room,
      timestamp: new Date().toISOString(),
      readBy: {},
      reactions: {}
    };

    // Initialize room messages array if needed
    if (!messages[room]) {
      messages[room] = [];
    }
    
    messages[room].push(message);
    
    // Limit stored messages per room to prevent memory issues
    if (messages[room].length > 500) {
      messages[room].shift();
    }

    // Increment unread counts for all users in the room except sender
    const roomUsers = getRoomUsers(room);
    roomUsers.forEach(user => {
      if (user.id !== socket.id) {
        if (!unreadCounts[room]) unreadCounts[room] = {};
        if (!unreadCounts[room][user.id]) unreadCounts[room][user.id] = 0;
        // Only increment if user is not currently viewing this room
        if (users[user.id]?.currentRoom !== room) {
          unreadCounts[room][user.id]++;
        }
      }
    });
    
    // Emit to all users in the room
    io.to(room).emit('receive_message', message);
    io.to(room).emit('unread_counts', unreadCounts[room]);
    
    // Send notification to users not in the room
    roomUsers.forEach(user => {
      if (user.id !== socket.id && users[user.id]?.currentRoom !== room) {
        io.to(user.id).emit('new_message_notification', {
          room,
          sender: message.sender,
          message: message.message?.substring(0, 50),
          unreadCount: unreadCounts[room][user.id] || 0
        });
      }
    });
  });

  // Handle typing indicator
  socket.on('typing', ({ isTyping, room }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    
    if (!typingUsers[currentRoom]) {
      typingUsers[currentRoom] = {};
    }

    if (isTyping) {
      typingUsers[currentRoom][socket.id] = users[socket.id].username;
    } else {
      delete typingUsers[currentRoom][socket.id];
    }
    
    socket.to(currentRoom).emit('typing_users', Object.values(typingUsers[currentRoom]));
  });

  // Handle private messages
  socket.on('private_message', ({ to, message, messageType = 'text', fileData }) => {
    if (!users[socket.id]) return;

    const recipientSocket = Object.entries(users).find(([id, user]) => user.id === to || user.username === to);
    
    if (!recipientSocket) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const messageId = uuidv4();
    const messageData = {
      id: messageId,
      sender: users[socket.id].username,
      senderId: socket.id,
      recipientId: recipientSocket[0],
      message,
      messageType,
      fileData,
      timestamp: new Date().toISOString(),
      isPrivate: true,
      read: false
    };

    // Store in private messages (could be enhanced with database)
    const privateRoomId = [socket.id, recipientSocket[0]].sort().join('_');
    if (!messages[`private_${privateRoomId}`]) {
      messages[`private_${privateRoomId}`] = [];
    }
    messages[`private_${privateRoomId}`].push(messageData);
    
    // Send to recipient
    io.to(recipientSocket[0]).emit('private_message', messageData);
    
    // Send back to sender for confirmation
    socket.emit('private_message', messageData);
    
    // Send notification
    io.to(recipientSocket[0]).emit('new_message_notification', {
      sender: messageData.sender,
      message: message?.substring(0, 50),
      isPrivate: true
    });
  });

  // Handle read receipts
  socket.on('mark_read', ({ messageId, room }) => {
    if (!users[socket.id] || !messageId) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    
    if (!readReceipts[messageId]) {
      readReceipts[messageId] = {};
    }
    
    readReceipts[messageId][socket.id] = new Date().toISOString();
    
    // Find message and update readBy
    const roomMessages = messages[currentRoom] || [];
    const message = roomMessages.find(m => m.id === messageId);
    if (message) {
      message.readBy = readReceipts[messageId];
      io.to(currentRoom).emit('message_read', { messageId, readBy: readReceipts[messageId] });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', ({ messageId, emoji, room }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    
    if (!reactions[messageId]) {
      reactions[messageId] = {};
    }
    
    if (!reactions[messageId][emoji]) {
      reactions[messageId][emoji] = [];
    }
    
    const username = users[socket.id].username;
    if (!reactions[messageId][emoji].includes(username)) {
      reactions[messageId][emoji].push(username);
    }
    
    // Update message reactions
    const roomMessages = messages[currentRoom] || [];
    const message = roomMessages.find(m => m.id === messageId);
    if (message) {
      message.reactions = reactions[messageId];
      io.to(currentRoom).emit('message_reaction', { messageId, reactions: reactions[messageId] });
    }
  });

  // Handle removing reaction
  socket.on('remove_reaction', ({ messageId, emoji, room }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    const username = users[socket.id].username;
    
    if (reactions[messageId] && reactions[messageId][emoji]) {
      reactions[messageId][emoji] = reactions[messageId][emoji].filter(u => u !== username);
      if (reactions[messageId][emoji].length === 0) {
        delete reactions[messageId][emoji];
      }
    }
    
    // Update message reactions
    const roomMessages = messages[currentRoom] || [];
    const message = roomMessages.find(m => m.id === messageId);
    if (message) {
      message.reactions = reactions[messageId];
      io.to(currentRoom).emit('message_reaction', { messageId, reactions: reactions[messageId] });
    }
  });

  // Handle message pagination
  socket.on('get_messages', ({ room, page = 1, limit = 50 }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    const roomMessages = messages[currentRoom] || [];
    
    const startIndex = Math.max(0, roomMessages.length - (page * limit));
    const endIndex = roomMessages.length - ((page - 1) * limit);
    const paginatedMessages = roomMessages.slice(startIndex, endIndex);
    
    socket.emit('messages_page', { 
      room: currentRoom, 
      messages: paginatedMessages,
      page,
      hasMore: startIndex > 0
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username, currentRoom } = users[socket.id];
      
      if (currentRoom) {
        socket.to(currentRoom).emit('user_left', { username, id: socket.id });
        
        // Clean up typing indicator
        if (typingUsers[currentRoom] && typingUsers[currentRoom][socket.id]) {
          delete typingUsers[currentRoom][socket.id];
          io.to(currentRoom).emit('typing_users', Object.values(typingUsers[currentRoom] || {}));
        }
        
        const roomUsers = getRoomUsers(currentRoom);
        io.to(currentRoom).emit('user_list', roomUsers);
      }
      
      console.log(`${username} left the chat`);
    }
    
    // Clean up user data
    delete users[socket.id];
    
    // Clean up unread counts
    rooms.forEach(room => {
      if (unreadCounts[room] && unreadCounts[room][socket.id]) {
        delete unreadCounts[room][socket.id];
      }
    });
  });
});

// Helper function to get users in a room
function getRoomUsers(room) {
  return Object.values(users).filter(user => user.currentRoom === room);
}

// API routes
app.get('/api/messages/:room?', (req, res) => {
  const room = req.params.room || 'general';
  res.json(messages[room] || []);
});

app.get('/api/users/:room?', (req, res) => {
  const room = req.params.room || 'general';
  res.json(getRoomUsers(room));
});

app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

app.get('/api/search/:room?', (req, res) => {
  const room = req.params.room || 'general';
  const query = req.query.q || '';
  
  if (!query) {
    return res.json([]);
  }
  
  const roomMessages = messages[room] || [];
  const searchResults = roomMessages.filter(msg => 
    msg.message?.toLowerCase().includes(query.toLowerCase()) ||
    msg.sender?.toLowerCase().includes(query.toLowerCase())
  );
  
  res.json(searchResults);
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Socket.io Chat Server is running',
    rooms: rooms,
    connectedUsers: Object.keys(users).length
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 