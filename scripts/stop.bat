@echo off
setlocal enabledelayedexpansion
REM Stops this application's own services by finding whichever process
REM is actually LISTENING on each of its ports (via netstat) and killing
REM that exact process tree. This is more reliable than matching on a
REM window title, because newly-spawned console windows in some
REM environments don't expose a readable title to taskkill's /FI filter.
REM
REM PostgreSQL is NOT touched here -- it's a pre-existing, shared
REM Windows service outside this application.

echo Stopping Demo SSO application services...

call :killport 8088 Keycloak
call :killport 8089 FastAPI
call :killport 3088 "Next.js Portal"
call :killport 3089 "Next.js Admin"

echo Done.
if /I not "%1"=="silent" pause
exit /b

:killport
set FOUND=0
set LASTPID=
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%~1 " ^| findstr "LISTENING"') do (
    if not "%%P"=="!LASTPID!" (
        echo   Stopping %~2 (PID %%P, port %~1^)...
    )
    taskkill /PID %%P /T /F >nul 2>&1
    set FOUND=1
    set LASTPID=%%P
)
if "!FOUND!"=="0" echo   %~2 is not running (port %~1 not in use).
exit /b
