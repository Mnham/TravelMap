@echo off
setlocal

cd /d "%~dp0"

if not exist "node_modules\" (
  echo Installing dependencies...
  call pnpm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

start "TravelMap Vite Server" cmd /k "cd /d "%~dp0" && pnpm run dev -- --host localhost --port 5173 --strictPort"

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/TravelMap/"

endlocal
