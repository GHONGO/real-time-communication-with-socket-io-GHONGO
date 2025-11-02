**Live Deployment URL's**
-**Frontend** : https://realtimesocketiochat.netlify.app/
-**Backend** : https://real-time-communication-with-socket-io-s7r6.onrender.com

# Real-Time Chat Application with Socket.io

A fully-featured real-time chat application built with React, Express, and Socket.io. This application demonstrates bidirectional communication between clients and server with advanced chat features.

## ✨ Features Implemented

### Core Features
- ✅ Real-time messaging using Socket.io
- ✅ Username-based authentication
- ✅ Multiple chat rooms (general, random, tech, gaming)
- ✅ Private messaging between users
- ✅ Online/offline user status
- ✅ Typing indicators
- ✅ Message timestamps

### Advanced Features
- ✅ Message reactions (emoji reactions)
- ✅ Read receipts for messages
- ✅ File and image sharing
- ✅ Message search functionality
- ✅ Unread message counts per room
- ✅ Real-time notifications (browser notifications + sound)
- ✅ Message pagination support
- ✅ Responsive design (mobile-friendly)
- ✅ Reconnection handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd real-time-communication-with-socket-io-GHONGO-main
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Configuration

Create a `.env` file in the `server` directory (optional):
```
PORT=5000
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `client` directory (optional):
```
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Application

1. Start the server:
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5000`

2. Start the client (in a new terminal):
```bash
cd client
npm run dev
```
The client will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

## 📋 Usage

1. **Login**: Enter a unique username to join the chat
2. **Join Rooms**: Select from available rooms (general, random, tech, gaming)
3. **Send Messages**: Type messages and press Enter or click send
4. **React to Messages**: Hover over messages and click emoji reactions
5. **Private Chat**: Click the chat icon next to any user to start a private conversation
6. **Search Messages**: Use the search bar in the sidebar to find messages
7. **Upload Files**: Click the attachment button to share images or files

## 🛠️ Project Structure

```
socketio-chat/
├── client/                 # React front-end
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # UI components
│   │   │   ├── Login.jsx
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── PrivateChat.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageItem.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── NotificationHandler.jsx
│   │   ├── socket/        # Socket.io client setup
│   │   │   └── socket.js
│   │   ├── App.jsx        # Main application component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   └── package.json       # Client dependencies
├── server/                # Node.js back-end
│   ├── server.js          # Main server file with Socket.io setup
│   └── package.json       # Server dependencies
├── README.md              # This file
├── screenshots of working app/ #Images of the app
└── Week5-Assignment.md   # Assignment instructions
```

## 🎯 Features Breakdown

### Task 1: Project Setup ✅
- ✅ Node.js server with Express configured
- ✅ Socket.io server configured
- ✅ React front-end application created
- ✅ Socket.io client integrated
- ✅ Basic connection established

### Task 2: Core Chat Functionality ✅
- ✅ Username-based authentication
- ✅ Global chat room functionality
- ✅ Message display with sender name and timestamp
- ✅ Typing indicators
- ✅ Online/offline user status

### Task 3: Advanced Chat Features ✅
- ✅ Private messaging between users
- ✅ Multiple chat rooms/channels
- ✅ "User is typing" indicator
- ✅ File and image sharing
- ✅ Read receipts for messages
- ✅ Message reactions (emoji)

### Task 4: Real-Time Notifications ✅
- ✅ Notifications for new messages
- ✅ Join/leave room notifications
- ✅ Unread message count display
- ✅ Sound notifications
- ✅ Browser notifications (Web Notifications API)

### Task 5: Performance and UX Optimization ✅
- ✅ Message pagination support
- ✅ Reconnection logic for disconnections
- ✅ Socket.io optimization (rooms implementation)
- ✅ Message delivery acknowledgment
- ✅ Message search functionality
- ✅ Responsive design for desktop and mobile

## 🔧 Technologies Used

- **Frontend**: React, Vite, Socket.io-client, date-fns
- **Backend**: Node.js, Express, Socket.io, CORS, dotenv
- **Styling**: CSS3 with responsive design

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

Mobile-specific features:
- Collapsible sidebar
- Touch-friendly interface
- Optimized message display

## 🔐 Security Notes

- Username validation (no duplicates)
- Input sanitization
- CORS configuration
- File size limits for uploads

## 📝 API Endpoints

### REST API
- `GET /api/messages/:room` - Get messages for a room
- `GET /api/users/:room` - Get users in a room
- `GET /api/rooms` - Get list of available rooms
- `GET /api/search/:room?q=query` - Search messages

### Socket.io Events

#### Client → Server
- `user_join` - Join chat with username
- `join_room` - Switch to a different room
- `send_message` - Send a message to current room
- `private_message` - Send a private message
- `typing` - Update typing status
- `add_reaction` - Add emoji reaction to message
- `remove_reaction` - Remove emoji reaction
- `mark_read` - Mark message as read
- `get_messages` - Get paginated messages

#### Server → Client
- `room_messages` - Receive room messages
- `receive_message` - Receive new message
- `user_list` - Updated list of users in room
- `user_joined` - User joined notification
- `user_left` - User left notification
- `typing_users` - List of users currently typing
- `unread_counts` - Unread message counts
- `message_reaction` - Message reaction update
- `message_read` - Read receipt update
- `new_message_notification` - New message notification

## 🐛 Troubleshooting

**Issue**: Server won't start
- Check if port 5000 is available
- Check the socket.js or the server.js on how the connection is set up and adjust appropriately, this file currently calls from a live deploy  so you may have to make adjustments. 
- Verify Node.js version (v18+)

**Issue**: Client can't connect to server
- Ensure server is running
- Check CORS configuration in server.js
- Verify CLIENT_URL in server .env matches client URL

**Issue**: Notifications not working
- Grant browser notification permissions
- Check browser console for errors

## 🚀 Deployment
**The project has been deployed in two phases. 

_Phase 1: Frontend_
-Deployed on Netlify

_Phase 2: Backend_
-Deployed on Render

## Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Building a Chat Application with Socket.io](https://socket.io/get-started/chat) 
