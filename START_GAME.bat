@echo off
title PiSecOps: Mumbai Open World
echo ===================================================
echo     PiSecOps: Mumbai Open World (GTA Mumbai 3D)
echo     594,000 Buildings - Apollo Bunder - Gateway of India
echo ===================================================
echo.
echo Starting local game server...
start http://localhost:5173/mumbai-3d/
call npx vite --host 0.0.0.0 --port 5173
pause
