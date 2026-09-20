!macro customInstall
  DetailPrint "Dang cai dat Apple Bonjour Service..."
  ExecWait 'msiexec.exe /i "$INSTDIR\resources\Bonjour64.msi" /qn /norestart'

  DetailPrint "Dang cau hinh tuong lua Windows Defender cho AirPlay..."
  ExecWait 'netsh advfirewall firewall add rule name="AirCast Studio - AirPlay Ports" dir=in action=allow protocol=TCP localport=5000,5050,7000,7100 profile=any'
  ExecWait 'netsh advfirewall firewall add rule name="AirCast Studio - Bonjour Discovery" dir=in action=allow protocol=UDP localport=5353 profile=any'
  ExecWait 'netsh advfirewall firewall add rule name="AirCast Studio - App" dir=in action=allow program="$INSTDIR\resources\bin\AirPlayServer.exe" enable=yes profile=any'
!macroend
