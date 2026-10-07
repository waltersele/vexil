@echo off
cd /d "%~dp0"
echo Vexil: build + subida FTP...
call npm run deploy
if errorlevel 1 (
  echo.
  echo Fallo el despliegue. Revisa .env y la conexion FTP.
  pause
  exit /b 1
)
echo.
echo Despliegue terminado.
pause
