@echo off
title AirCast Studio
cd /d "%~dp0"
set "PATH=%~dp0;%PATH%"
call npm.cmd start
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [LOI] Khong the khoi dong AirCast Studio! Ma loi: %ERRORLEVEL%
  pause
)
