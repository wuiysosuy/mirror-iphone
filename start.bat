@echo off
title AirCast Studio
cd /d "%~dp0"
set "PATH=%~dp0;%PATH%"
call npm.cmd start