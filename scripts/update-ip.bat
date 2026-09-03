@echo off
setlocal enabledelayedexpansion
REM Detects this machine's current LAN IP and rewrites every config
REM file that hardcodes it (both Next.js apps' .env.local, FastAPI's
REM .env), then re-registers that IP's redirect URI / web origin on
REM both Keycloak clients via kcadm.bat -- so LAN access keeps working
REM after a DHCP lease renewal changes the address.
REM
REM Note: this script (unlike start/stop/status/restart) uses one
REM narrow, read-only PowerShell one-liner purely to identify the
REM correct network adapter's IP -- plain batch has no reliable,
REM locale-independent way to do that (parsing "ipconfig" text risks
REM picking a VMware/VirtualBox virtual adapter's IP by mistake). No
REM process/service management happens via PowerShell; that's all
REM plain batch + kcadm.bat (Keycloak's own bundled admin CLI) below.
REM
REM Run this after your IP changes, then scripts\restart.bat.

set "LANIP="
for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'VMware|VirtualBox|vEthernet|Loopback' } | Sort-Object -Property @{Expression={$_.PrefixOrigin -eq 'Dhcp'};Descending=$true} | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LANIP=%%A"

if "%LANIP%"=="" (
    echo Could not detect a LAN IP -- leaving existing config untouched.
    pause
    exit /b 1
)

echo Detected LAN IP: %LANIP%

set "OLDIP="
for /f "tokens=2 delims=/" %%A in ('findstr /R "^KEYCLOAK_ISSUER=http://[0-9]" "%~dp0..\nextjs-portal\.env.local" 2^>nul') do (
    for /f "tokens=1 delims=:" %%B in ("%%A") do set "OLDIP=%%B"
)

if "%OLDIP%"=="%LANIP%" (
    echo Config already up to date for %LANIP%.
) else if "%OLDIP%"=="" (
    echo No previous IP found in nextjs-portal\.env.local -- set
    echo AUTH_URL / KEYCLOAK_ISSUER to http://%LANIP%:... by hand once
    echo first (see docs^), then this script will keep it updated
    echo automatically from then on.
    pause
    exit /b 1
) else (
    echo Updating config from %OLDIP% to %LANIP%...
    powershell -NoProfile -Command "(Get-Content '%~dp0..\nextjs-portal\.env.local') -replace [regex]::Escape('%OLDIP%'), '%LANIP%' | Set-Content '%~dp0..\nextjs-portal\.env.local'"
    powershell -NoProfile -Command "(Get-Content '%~dp0..\nextjs-admin\.env.local') -replace [regex]::Escape('%OLDIP%'), '%LANIP%' | Set-Content '%~dp0..\nextjs-admin\.env.local'"
    powershell -NoProfile -Command "(Get-Content '%~dp0..\fastapi-app\.env') -replace [regex]::Escape('%OLDIP%'), '%LANIP%' | Set-Content '%~dp0..\fastapi-app\.env'"
    REM allowedDevOrigins in next.config.ts -- without this, LAN clients
    REM get a page whose buttons don't work (see the comment in that file).
    powershell -NoProfile -Command "(Get-Content '%~dp0..\nextjs-portal\next.config.ts') -replace [regex]::Escape('%OLDIP%'), '%LANIP%' | Set-Content '%~dp0..\nextjs-portal\next.config.ts'"
    powershell -NoProfile -Command "(Get-Content '%~dp0..\nextjs-admin\next.config.ts') -replace [regex]::Escape('%OLDIP%'), '%LANIP%' | Set-Content '%~dp0..\nextjs-admin\next.config.ts'"
)

REM Re-register the current IP's redirect URI / web origin on both
REM Keycloak clients. Only ever keeps "localhost" + the CURRENT LAN IP
REM registered (stale previous IPs are dropped on each sync).
netstat -ano | findstr ":8088 " | findstr "LISTENING" >nul
if not %errorlevel%==0 (
    echo Keycloak is not running -- start it first, then re-run this
    echo script to sync the new IP into its client configuration.
    pause
    exit /b 0
)

set "KCADM=C:\Keycloak\keycloak-26.7.3\bin\kcadm.bat"
set "TMPOUT=%TEMP%\demosso-kcadm-out.txt"

call %KCADM% config credentials --server http://localhost:8088 --realm master --user admin --password admin123 >nul 2>&1

REM kcadm.bat's output must be redirected to a file and re-read, rather
REM than captured directly by a "for /f ('call kcadm.bat ...')" -- that
REM pattern reliably comes back empty for kcadm.bat specifically (found
REM while building this script), likely due to how its own Java
REM launcher interacts with for/f's internal piping.
call %KCADM% get clients -r demo-sso -q clientId=nextjs-portal -F id --format csv --noquotes > "%TMPOUT%" 2>nul
set "PORTAL_UUID="
for /f "usebackq delims=" %%U in ("%TMPOUT%") do set "PORTAL_UUID=%%U"

call %KCADM% get clients -r demo-sso -q clientId=nextjs-admin -F id --format csv --noquotes > "%TMPOUT%" 2>nul
set "ADMIN_UUID="
for /f "usebackq delims=" %%U in ("%TMPOUT%") do set "ADMIN_UUID=%%U"

if not "%PORTAL_UUID%"=="" (
    call %KCADM% update clients/%PORTAL_UUID% -r demo-sso -s "redirectUris=[\"http://localhost:3088/api/auth/callback/keycloak\",\"http://%LANIP%:3088/api/auth/callback/keycloak\"]" -s "webOrigins=[\"http://localhost:3088\",\"http://%LANIP%:3088\"]"
    echo   Synced nextjs-portal for %LANIP%
) else (
    echo   Could not find client nextjs-portal -- skipping.
)

if not "%ADMIN_UUID%"=="" (
    call %KCADM% update clients/%ADMIN_UUID% -r demo-sso -s "redirectUris=[\"http://localhost:3089/api/auth/callback/keycloak\",\"http://%LANIP%:3089/api/auth/callback/keycloak\"]" -s "webOrigins=[\"http://localhost:3089\",\"http://%LANIP%:3089\"]"
    echo   Synced nextjs-admin for %LANIP%
) else (
    echo   Could not find client nextjs-admin -- skipping.
)

del "%TMPOUT%" >nul 2>&1

echo.
echo Done. Run scripts\restart.bat for the new IP to take effect.
pause
exit /b 0
