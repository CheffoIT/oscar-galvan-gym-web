@echo off
chcp 65001 > nul
echo ============================================
echo  Instalando dependencias WhatsApp...
echo ============================================
echo.
echo Esto puede tardar 2-3 minutos porque descarga
echo el navegador Chromium automaticamente.
echo.

cd /d "C:\Users\Cheffo\Documents\Claude\Projects\Pagina web gym\oscar-galvan-gym-web\backend"

echo [1/2] Instalando node-cron...
call npm install node-cron
echo.

echo [2/2] Instalando whatsapp-web.js (espera, descarga Chromium)...
call npm install whatsapp-web.js
echo.

echo ============================================
if %ERRORLEVEL% == 0 (
    echo  LISTO! Dependencias instaladas correctamente.
    echo  Ya podes usar el modulo WhatsApp desde el admin.
) else (
    echo  Hubo un error. Revisa los mensajes de arriba.
)
echo ============================================
echo.
pause
