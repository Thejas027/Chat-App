# 💬 Chat-App

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/node-%3E=18-green)
![MongoDB](https://img.shields.io/badge/mongodb-%3E=5-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A modern, full-stack real-time chat application for secure, instant messaging and collaboration. Built with React, Node.js, MongoDB, and Socket.io for robust, scalable, and responsive real-time communication.

---

## 🏗️ Key Architecture & Operation Summary

- **Full-stack:** React (Vite) frontend, Node.js/Express backend, MongoDB database, and Socket.io real-time engine.
- **Authentication:** Secure JWT-based login/session. Passwords are bcrypt-hashed.
- **Private & Group Chat:** Each chat is both a MongoDB document and a Socket.io "room".
- **Real-Time Events:** Instant updates for messages, typing, read receipts, presence, edits, and more.
- **Event-Driven UX:** All chat events are scoped to the relevant room for privacy and efficiency.
- **Database:**  
  - **Users:** Credentials, profile, avatar, online status  
  - **Conversations:** Participants, type (private/group), metadata  
  - **Messages:** Content, sender, attachments, status, replies  
- **Security:**  
  - Auth required for all APIs and socket events  
  - Socket.io middleware validates JWT before room join  
  - Events scoped by conversation for privacy  
- **Scalable:** Modular backend, NoSQL database, easy to extend for more features  
- **Textual System Diagram:**

```
+------------+          HTTP/REST           +------------+         +------------+
|            |  -------------------------> |            |         |            |
|  Frontend  | <-------------------------  |  Backend   | <-----> |  Database  |
|  (React)   |      (API Requests)         | (Node.js,  |         | (MongoDB)  |
|            |                             |  Express)  |         |            |
|            |   <-- Socket.io (Events) -->|            |         |            |
+------------+         (WebSocket)         +------------+         +------------+
       ^                    ^                                            
       |                    |                                            
       |  (Socket.io-client)|                                            
       +--------------------+                                            
        Real-time, bidirectional                                        
        event communication                                              
```

---

## ✨ Features

- **Robust, scalable real-time architecture** (see summary above)
- **Secure authentication:** JWT login, bcrypt password hashing, input validation, and route protection
- **Private & group messaging:** Instant real-time delivery, typing indicators, read receipts, and online presence
- **Modern UI/UX:** Responsive design, dark mode, emoji picker, toast notifications, and smooth interactions
- **Media & file sharing:** Send images, files, and change avatars
- **Message reactions & threads:** Emoji reactions, replies, edit/delete
- **Mobile ready:** Fully responsive for all devices
- **Easy to extend:** Clean, modular codebase

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- React Router
- Tailwind CSS
- Socket.io Client
- React Hot Toast

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io
- JWT, bcryptjs

---

## ⚡️ How It Works

- **Frontend:** Handles UI, state, routing, and real-time events via Socket.io-client
- **Backend:** Manages REST APIs, authentication, and real-time signaling via Socket.io
- **Database:** MongoDB persists users, conversations, and messages
- **Socket.io:** Ensures real-time, bidirectional communication; each conversation is a "room" for scoped events

**Authentication:**  
JWT-based for both REST and socket events, with bcrypt-hashed passwords

**Message Flow:**  
1. User sends a message (via API/socket)
2. Backend authenticates and stores it in MongoDB
3. Backend emits a `new_message` event to all sockets in the conversation room
4. All participants instantly see the update

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/Thejas027/Chat-App.git
    cd Chat-App
    ```

2. **Set up environment variables**

    Create a `.env` file in the root directory:
    ```env
    NODE_ENV=development
    PORT=5000
    CLIENT_URL=http://localhost:5173
    JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
    MONGODB_URI=mongodb://localhost:27017/chatapp
    ```

    Create a `.env` file in the `client` directory:
    ```env
    VITE_API_URL=http://localhost:5000
    ```

3. **Install backend dependencies**
    ```bash
    npm install
    ```

4. **Install frontend dependencies**
    ```bash
    cd client
    npm install
    cd ..
    ```

5. **Start MongoDB**
    Make sure MongoDB is running on your system:
    ```bash
    mongod
    ```

6. **Start the application**

    **Option 1: Start both servers separately**

    Terminal 1 (Backend):
    ```bash
    npm run dev
    ```

    Terminal 2 (Frontend):
    ```bash
    cd client
    npm run dev
    ```

    **Option 2: Start both with concurrently (if configured)**
    ```bash
    npm run dev:all
    ```

7. **Open your browser**
    - Frontend: http://localhost:5173
    - Backend API: http://localhost:5000

---

## 📚 API & Socket Events Overview

| Endpoint/Event                | Description                         |
|-------------------------------|-------------------------------------|
| `POST /api/auth/register`     | Register user                       |
| `POST /api/auth/login`        | User login                          |
| `GET /api/conversations`      | List user's conversations           |
| `POST /api/messages`          | Send a message                      |
| `GET /api/messages/:id`       | Get conversation messages           |
| `join_conversation` (Socket)  | Join a chat room                    |
| `send_message` (Socket)       | Send message in real time           |
| `new_message` (Socket)        | Receive new message event           |
| `user_typing` (Socket)        | Typing indicator                    |
| ...                           | See source for full list            |

---

## 🧪 Testing

```bash
# Backend
npm test

# Frontend
cd client && npm test
```

Test:
- Register/login
- Join/start conversations
- Send/receive messages (real-time)
- File upload
- Theme toggle
- Mobile responsiveness

---

## 🧩 Scaling & Extensibility

- **Socket.io rooms** isolate traffic and make horizontal scaling easy (with Redis adapter for multi-server setups)
- **NoSQL schema** supports flexible, evolving data models
- **Modular codebase** enables easy addition of new features: notifications, video calls, bots, etc.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request!

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Thejas027**  
- GitHub: [@Thejas027](https://github.com/Thejas027)

---

## 🙏 Acknowledgments

- React team for the amazing frontend library
- Express.js for the robust backend framework
- Socket.io for real-time communication
- MongoDB for the flexible database
- Tailwind CSS for the utility-first styling

---

⭐ **If you found this project helpful, please give it a star!** ⭐