@echo off
cd /d "%~dp0..\fastapi-app"
call venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8089
