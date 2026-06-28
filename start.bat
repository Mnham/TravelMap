@echo off
setlocal

cd /d "%~dp0"

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

start "TravelMap Vite Server" cmd /k "cd /d "%~dp0" && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5173/"

endlocal
