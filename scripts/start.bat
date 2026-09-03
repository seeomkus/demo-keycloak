@echo off
REM Starts this application's own services (Keycloak, FastAPI, Next.js
REM Portal, Next.js Admin) fully in the background -- no new terminal
REM windows are opened. Each service's console output is redirected to
REM scripts\logs\<service>.log instead, in case you need to check it.
REM Skips any service whose port is already in use.
REM
REM PostgreSQL is NOT started here on purpose -- it's a pre-existing,
REM shared Windows service outside this application. Make sure it's
REM already running (see status.bat) before using this script.

if not exist "%~dp0logs" mkdir "%~dp0logs"

call :checkstart 8088 Keycloak run-keycloak.bat keycloak
call :checkstart 8089 FastAPI run-fastapi.bat fastapi
call :checkstart 3088 "Next.js Portal" run-portal.bat portal
call :checkstart 3089 "Next.js Admin" run-admin.bat admin

echo.
echo Startup requests sent, running in the background (no new windows).
echo Keycloak usually takes 15-20 seconds longer than the others to
echo become ready. Run status.bat to check, or see scripts\logs\*.log
echo for output from each service.
echo.
pause
exit /b

:checkstart
REM %1=port  %2=display name  %3=run-*.bat file name  %4=log file base name
netstat -ano | findstr ":%~1 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo %~2 already running on :%~1 -- skipping.
) else (
    echo Starting %~2 in the background...
    start "" /B cmd /c ""%~dp0%~3" > "%~dp0logs\%~4.log" 2>&1"
)
exit /b
