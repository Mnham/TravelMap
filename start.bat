@echo off
cd /d "%~dp0"
start "" cmd /c "timeout /t 3 /nobreak >nul && start "" http://localhost:5173/TravelMap/"
pnpm run dev -- --host localhost --port 5173 --strictPort
pause
