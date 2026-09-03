@echo off
cd /d C:\Keycloak\keycloak-26.7.3\bin
set KC_DB_PASSWORD=keycloak_demo_pass
set KC_BOOTSTRAP_ADMIN_USERNAME=admin
set KC_BOOTSTRAP_ADMIN_PASSWORD=admin123
call C:\Keycloak\keycloak-26.7.3\bin\kc.bat start-dev --http-port=8088 --http-host=0.0.0.0
