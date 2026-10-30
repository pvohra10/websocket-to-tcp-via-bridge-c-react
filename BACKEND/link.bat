@echo off
echo ==================================================
echo Launching Stack: Backend (WSL) -> Bridge (Node)
echo ==================================================

:: Step 1: Launch the React Development Server
echo Starting Frontend...
start "React Development Server" cmd /k "cd /d C:\Users\parth\Desktop\CoolShit\Git\websocket_to_tcp\websocket-tcp\ && npm run dev"
start "" "http://localhost:5173/"

timeout /t 1 /nobreak >nul

echo Compiling Backend...
start "Wsl" cmd /k "cd C:\Users\parth\Desktop\CoolShit\Git\websocket_to_tcp\websocket-tcp\BACKEND\ && wsl.exe g++ server_Side.cpp -o server && wsl.exe ./server"

timeout /t 5 /nobreak >nul
:: Step 3: Launch the Bridge via Node
echo Starting Bridge...
start "Bridge Server" cmd /k "cd /d C:\Users\parth\Desktop\CoolShit\Git\websocket_to_tcp\websocket-tcp\src\ && node Bridge.cjs"

echo All background components launched!
timeout /t 1 /nobreak >nul
