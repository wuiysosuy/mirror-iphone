@echo off
chcp 65001 >nul
title Cài Đặt Apple Bonjour Cho Windows
echo ========================================================
echo   Đang mở trình cài đặt Apple Bonjour 64-bit...
echo ========================================================
echo.
cd /d "%~dp0.."
start Bonjour64.msi
echo Vui lòng bấm "Next" trên cửa sổ hiện lên để hoàn tất cài đặt Bonjour.
echo.
pause
