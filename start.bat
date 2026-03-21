@echo off
start "Backend" cmd /k "cd /d C:\Users\italo\Desktop\wa-sender\backend && node src/index.js"
timeout /t 2 >nul
start "Frontend" cmd /k "cd /d C:\Users\italo\Desktop\wa-sender\app && npm run dev"
timeout /t 3 >nul
start http://localhost:5173
