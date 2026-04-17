@echo off
echo ==========================================
echo   Invoicer System Starting...
echo ==========================================

:: Start Backend in a new window
echo Starting Backend Server (Port 5000)...
start "Invoicer-Backend" cmd /k "cd backend && node index.js"

:: Start Frontend in a new window
echo Starting Frontend (Port 5173)...
start "Invoicer-Frontend" cmd /k "cd html && npm run dev"

echo.
echo ==========================================
echo   Servers are running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Check the new windows for logs.
echo ==========================================
pause
