@echo off
REM Shows live status of every service this demo depends on, using only
REM built-in Windows tools (netstat, sc) -- no PowerShell involved.

echo.
echo === Demo SSO - Service Status ===
echo.

sc query postgresql-x64-17 | findstr /C:"RUNNING" >nul
if %errorlevel%==0 (
    echo   [UP]   PostgreSQL          (Windows service, :5432^)
) else (
    echo   [DOWN] PostgreSQL          (Windows service, :5432^) -- check 'services.msc'
)

call :checkport 8088 "Keycloak           "
call :checkport 8089 "FastAPI            "
call :checkport 3088 "Next.js Portal     "
call :checkport 3089 "Next.js Admin      "

echo.
pause
exit /b

:checkport
netstat -ano | findstr ":%~1 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo   [UP]   %~2 :%~1
) else (
    echo   [DOWN] %~2 :%~1
)
exit /b
