# Chat-App 💬

A modern, real-time chat application built with React, Node.js, Express, MongoDB, and Socket.io. Features include user authentication, private messaging, group conversations, file sharing, and a beautiful dark mode interface.

## ✨ Features

### 🔐 Authentication & Security
- User registration and login with JWT tokens
- Secure password hashing with bcrypt
- Protected routes and middleware
- Session management with HTTP-only cookies
- Input validation and sanitization

### 💬 Real-time Messaging
- Instant messaging with Socket.io
- Private conversations
- Group chat support
- Typing indicators
- Message read receipts
- Online/offline status tracking

### 🎨 Modern UI/UX
- Clean, responsive design with Tailwind CSS
- Dark mode toggle
- Loading states and error handling
- Toast notifications
- Emoji picker support
- File upload capabilities

### 📱 Additional Features
- Message search functionality
- User avatar management
- Conversation management
- Message reactions
- Reply to messages
- Real-time user status updates

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **React Hot Toast** - Toast notifications
- **PropTypes** - Runtime type checking

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## 📁 Project Structure

```
Chat-App/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   └── ui/       # Core UI component library
│   │   ├── context/      # React Context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   │   ├── authentication/
│   │   │   └── chat/
│   │   ├── services/     # API service layer
│   │   ├── styles/       # CSS and styling
│   │   └── utils/        # Utility functions
│   ├── package.json
│   └── vite.config.js
├── config/               # Database configuration
├── controllers/          # Express route controllers
├── middleware/           # Custom middleware
├── models/              # Mongoose models
├── routes/              # Express routes
├── socket/              # Socket.io configuration
├── utils/               # Backend utilities
├── server.js            # Main server file
├── package.json         # Backend dependencies
├── .env                 # Environment variables
└── README.md           # Project documentation
```

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

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Conversation Endpoints
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations/private` - Create private conversation
- `POST /api/conversations/group` - Create group conversation

### Message Endpoints
- `GET /api/messages/:conversationId` - Get messages for conversation
- `POST /api/messages` - Send a message
- `PUT /api/messages/:messageId` - Edit a message
- `DELETE /api/messages/:messageId` - Delete a message
- `GET /api/messages/search/:conversationId` - Search messages

## 🔧 Development

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Structure

#### Frontend Components
```
components/
├── ui/                 # Core UI components
│   ├── Button.jsx     # Reusable button component
│   ├── Input.jsx      # Form input component
│   ├── LoadingSpinner.jsx
│   └── ErrorMessage.jsx
├── debug/             # Development tools
└── [feature-specific components]
```

#### Backend Structure
```
controllers/           # Request handlers
middleware/           # Express middleware
models/              # Database models
routes/              # API routes
socket/              # Socket.io handlers
utils/               # Helper functions
```

## 🔒 Environment Variables

### Backend (.env)
```env
NODE_ENV=development|production
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb://localhost:27017/chatapp
```

### Frontend (client/.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🚢 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   CLIENT_URL=https://your-domain.com
   MONGODB_URI=mongodb+srv://your-cluster-url
   JWT_SECRET=your-strong-production-secret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

Create a `Dockerfile` in the root directory:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd client
npm test
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Creating conversations
- [ ] Sending and receiving messages
- [ ] Real-time updates
- [ ] File uploads
- [ ] Dark mode toggle
- [ ] Mobile responsiveness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Thejas027**
- GitHub: [@Thejas027](https://github.com/Thejas027)

## 🙏 Acknowledgments

- React team for the amazing frontend library
- Express.js for the robust backend framework
- Socket.io for real-time communication
- MongoDB for the flexible database
- Tailwind CSS for the utility-first styling

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/Thejas027/Chat-App/issues) page
2. Create a new issue if your problem isn't already addressed
3. Provide detailed information about your environment and the issue

---

⭐ **If you found this project helpful, please give it a star!** ⭐
