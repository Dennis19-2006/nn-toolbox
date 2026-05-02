@echo off
echo Starting NN Toolbox...

:: Start Backend
start cmd /k "cd backend && python -m uvicorn main:app --reload"

:: Start Frontend
start cmd /k "cd frontend && npm run dev"

echo Services are starting in separate windows.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
