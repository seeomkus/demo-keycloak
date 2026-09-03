@echo off
REM Stops then starts every application service.

call "%~dp0stop.bat" silent
echo Waiting a moment before restarting...
ping -n 4 127.0.0.1 >nul
call "%~dp0start.bat"
