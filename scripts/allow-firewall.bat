@echo off
chcp 65001 >nul
echo ========================================================
echo   AirCast Studio - Cấu hình Tường lửa Windows Defender
echo ========================================================
echo.
echo Đang kiểm tra quyền Administrator...

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Vui lòng bấm chuột phải vào file này và chọn "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo [+] Đang cấu hình các cổng kết nối cho AirPlay Screen Mirroring và QR Code Portal...
echo.

:: Xóa quy tắc cũ nếu có
netsh advfirewall firewall delete rule name="AirCast Studio - AirPlay Ports" >nul 2>&1
netsh advfirewall firewall delete rule name="AirCast Studio - Bonjour Discovery" >nul 2>&1
netsh advfirewall firewall delete rule name="AirCast Studio - App" >nul 2>&1

:: Thêm quy tắc cho cổng TCP (7000, 7100, 5000, 5050)
netsh advfirewall firewall add rule name="AirCast Studio - AirPlay Ports" dir=in action=allow protocol=TCP localport=5000,5050,7000,7100 profile=any
if %errorLevel% equ 0 (
    echo [OK] Đã mở cổng TCP 5000, 5050, 7000, 7100 (AirPlay RTSP & QR Mobile Portal)
) else (
    echo [ERROR] Không thể mở cổng TCP.
)

:: Thêm quy tắc cho mDNS UDP 5353 (Bonjour tìm kiếm thiết bị)
netsh advfirewall firewall add rule name="AirCast Studio - Bonjour Discovery" dir=in action=allow protocol=UDP localport=5353 profile=any
if %errorLevel% equ 0 (
    echo [OK] Đã mở cổng UDP 5353 (Bonjour / mDNS Discovery)
) else (
    echo [ERROR] Không thể mở cổng UDP 5353.
)

:: Thêm quy tắc cho file thực thi AirPlayServer.exe
set "EXE_PATH=%~dp0..\bin\AirPlayServer.exe"
if exist "%EXE_PATH%" (
    netsh advfirewall firewall add rule name="AirCast Studio - App" dir=in action=allow program="%EXE_PATH%" enable=yes profile=any
    echo [OK] Đã cấp quyền toàn diện cho AirPlayServer.exe
)

echo.
echo ========================================================
echo   HOÀN TẤT! Tường lửa Windows đã sẵn sàng cho iPhone kết nối.
echo ========================================================
echo.
pause
