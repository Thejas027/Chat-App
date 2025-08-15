@echo off
REM Chat App Deployment Script for Windows

echo 🚀 Starting Chat App...

REM Kill any existing processes
echo 🧹 Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1 || echo No existing node processes found

REM Wait a moment for processes to clean up
timeout /t 2 /nobreak >nul

REM Start backend server
echo 🖥️  Starting backend server...
cd server
start /B npm run dev
echo Backend server started

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Start frontend client  
echo 🌐 Starting frontend client...
cd ..\client
start /B npm run dev
echo Frontend client started

REM Wait for client to start
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Chat App is now running!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend:  http://localhost:5001
echo.
echo To stop the application, close this window or press Ctrl+C
echo.

REM Keep script running
pause
