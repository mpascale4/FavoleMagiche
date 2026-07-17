@echo off
setlocal

cd /d "%~dp0"

echo [Favole Magiche] Avvio applicazione...

if not exist "node_modules" (
  echo [Favole Magiche] Dipendenze non trovate. Avvio installazione...
  call npm install
  if errorlevel 1 goto :error
)

echo [Favole Magiche] Lancio server di sviluppo Vite...
call npm run dev
if errorlevel 1 goto :error

goto :eof

:error
echo.
echo [Favole Magiche] Si e verificato un errore durante l'avvio.
pause
exit /b 1

