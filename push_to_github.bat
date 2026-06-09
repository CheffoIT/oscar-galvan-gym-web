@echo off
chcp 65001 > nul
echo ============================================
echo  Subiendo codigo a GitHub...
echo ============================================
echo.

cd /d "C:\Users\Cheffo\Documents\Claude\Projects\Pagina web gym\oscar-galvan-gym-web"

echo [1/6] Eliminando .git anterior si existe...
if exist ".git" rmdir /s /q ".git"

echo [2/6] Inicializando repositorio git...
git init
git config core.symlinks false
git config core.autocrlf false

echo [3/6] Configurando remote...
git remote add origin https://github.com/CheffoIT/oscar-galvan-gym-web.git

echo [4/6] Agregando todos los archivos...
git add .

echo [5/6] Haciendo commit inicial...
git commit -m "Initial commit: Plataforma web gimnasio Oscar Galvan - Full stack React + Supabase"

echo [6/6] Subiendo a GitHub (rama main)...
git branch -M main
git push -u origin main

echo.
echo ============================================
if %ERRORLEVEL% == 0 (
    echo  LISTO! Codigo subido exitosamente.
    echo  Ver en: https://github.com/CheffoIT/oscar-galvan-gym-web
) else (
    echo  Hubo un error. Revisa los mensajes de arriba.
)
echo ============================================
echo.
pause
