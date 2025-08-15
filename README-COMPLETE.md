# 💬 Real-Time Chat Application

A modern, full-stack real-time chat application built with React, Node.js, Socket.io, and MongoDB.

![Chat App Demo](https://img.shields.io/badge/Status-Complete-success)
![React](https://img.shields.io/badge/React-19.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22.16-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-lightblue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.16-darkgreen)

## ✨ Features

### 🔐 **Authentication & Security**
- **JWT-based Authentication**: Secure login/register system with token-based authentication
- **Password Hashing**: Bcrypt encryption for password security
- **Protected Routes**: Frontend route protection based on authentication state
- **Session Management**: Automatic token refresh and secure logout

### 💬 **Real-Time Messaging**
- **Instant Messaging**: Real-time message delivery using Socket.io
- **Typing Indicators**: Live typing status for active conversations
- **Message Status**: Delivery and read receipts for sent messages
- **Online Presence**: Real-time user online/offline status
- **Message History**: Persistent message storage and retrieval

### 👥 **User Management**
- **User Profiles**: Complete profile management with avatars
- **User Search**: Find and connect with other users
- **Online Status**: Real-time presence indicators
- **User Discovery**: Browse and search registered users

### 💬 **Conversation Features**
- **Private Conversations**: One-on-one messaging
- **Group Conversations**: Multi-user group chats (backend ready)
- **Conversation List**: Organized conversation sidebar
- **Unread Counters**: Visual indicators for unread messages
- **Last Message Preview**: Quick conversation overview

### 📎 **File Sharing** (Backend Ready)
- **File Upload**: Support for images, documents, and media files
- **File Validation**: Type and size restrictions for security
- **File Download**: Secure file retrieval system
- **Multiple Attachments**: Send multiple files in a single message

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first, works on all devices
- **Dark Mode Ready**: Theme system prepared for dark mode
- **Tailwind CSS**: Modern, utility-first styling
- **Loading States**: Smooth loading animations and feedback
- **Error Handling**: Comprehensive error boundaries and toast notifications
- **Smooth Animations**: Polished user experience with transitions

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js** (v18+ recommended)
- **MongoDB** (local or MongoDB Atlas)
- **Git**
- **npm** or **yarn**

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Chat-App
   ```

2. **Environment Setup**
   
   Create `.env` file in the `server` directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/chatapp
   
   # JWT Security
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5001
   CLIENT_URL=http://localhost:5173
   
   # Environment
   NODE_ENV=development
   ```

3. **Install Dependencies & Start**
   ```bash
   # Windows
   start-app.bat

   # Linux/Mac
   chmod +x start-app.sh
   ./start-app.sh
   ```

4. **Access the Application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5001

## 📱 **How to Use**

### **Getting Started**
1. **Register**: Create a new account with email and password
2. **Login**: Sign in with your credentials
3. **Discover Users**: Browse available users to start conversations
4. **Start Chatting**: Send real-time messages with typing indicators
5. **File Sharing**: Attach images and documents (backend ready)

### **Key Features**
- **Real-time Messaging**: Messages appear instantly
- **Typing Indicators**: See when others are typing
- **Online Status**: Know who's currently online
- **Message History**: All conversations are saved
- **Mobile Responsive**: Works on phones and tablets

## 🏗️ **Architecture**

### **Frontend (React)**
```
client/
├── src/
│   ├── components/           # Reusable UI components
│   ├── context/             # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Application pages
│   ├── services/            # API communication layer
│   └── utils/               # Helper functions
```

### **Backend (Node.js/Express)**
```
server/
├── controllers/             # Request handlers
├── middleware/             # Express middleware
├── models/                 # MongoDB schemas
├── routes/                 # API route definitions
├── socket/                 # Real-time communication
└── config/                 # Configuration files
```

## 🔧 **API Documentation**

### **Authentication**
```
POST /api/auth/register    # Create new account
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
POST /api/auth/refresh     # Refresh JWT token
```

### **Users**
```
GET  /api/users           # Get all users (with search)
GET  /api/users/me        # Get current user profile
PUT  /api/users/profile   # Update user profile
```

### **Conversations**
```
GET  /api/conversations                    # Get user's conversations
POST /api/conversations/private            # Create private conversation
PUT  /api/conversations/:id/read           # Mark conversation as read
```

### **Messages**
```
GET  /api/messages/:conversationId        # Get conversation messages
POST /api/messages                        # Send new message
PUT  /api/messages/:id                     # Edit message
DELETE /api/messages/:id                   # Delete message
```

## 🛠️ **Built With**

### **Frontend**
- **React 19** - Modern React with latest features
- **Vite** - Lightning-fast build tool
- **Socket.io Client** - Real-time communication
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - NoSQL document database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

## 🚀 **Deployment**

### **Backend Deployment**
1. Set production environment variables
2. Configure MongoDB connection string
3. Deploy to Heroku, Railway, DigitalOcean, or AWS

### **Frontend Deployment**
1. Set `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy to Vercel, Netlify, or GitHub Pages

## 🔐 **Security Features**

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Input Validation**: Express-validator for request sanitization
- **CORS Protection**: Configured cross-origin resource sharing
- **File Upload Security**: Type and size validation

## 🎯 **Current Status**

### ✅ **Completed Features**
- ✅ User authentication system
- ✅ Real-time messaging with Socket.io
- ✅ User profile management
- ✅ Conversation management
- ✅ Message persistence
- ✅ Responsive UI components
- ✅ Error handling and loading states
- ✅ Typing indicators
- ✅ Online presence
- ✅ File upload backend system

### 🚧 **In Progress**
- 🔧 File upload UI integration
- 🔧 Advanced group chat features
- 🔧 Message search functionality

### 📋 **Future Enhancements**
- 📅 Video/voice calling
- 📅 Message reactions
- 📅 Push notifications
- 📅 Message encryption
- 📅 Mobile app

## 📞 **Support**

For questions or issues:
1. Check the [Issues](../../issues) page
2. Create a new issue with details
3. Contact the development team

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License.

---

**Built with ❤️ for real-time communication**

*Last updated: August 2025*
