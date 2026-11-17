@echo off
title MarketMind - iniciar servicos
set RAIZ=%~dp0

echo ============================================
echo  MarketMind - subindo back, IA e front
echo ============================================
echo.
echo LEMBRETE: o MySQL precisa estar iniciado no XAMPP Control Panel.
echo.

start "MarketMind - BACK" cmd /k "cd /d %RAIZ%back && npm install && npm run dev"
timeout /t 3 /nobreak >nul

start "MarketMind - IA" cmd /k "cd /d %RAIZ%chat_ia && npm install && npm run dev"
timeout /t 3 /nobreak >nul

start "MarketMind - FRONT" cmd /k "cd /d %RAIZ%front && npm install && npm run dev"

echo.
echo Tres janelas abertas. Verifique se cada uma mostra "servidor rodando".
echo O front abre em http://localhost:5173
echo.
pause
