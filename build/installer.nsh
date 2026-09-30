; Tat cac tien trinh con cua app truoc khi ghi de file (khi cap nhat chung dang khoa file trong resources\bin)
!macro customInit
  nsExec::Exec 'taskkill /F /IM AirPlayServer.exe /T'
  nsExec::Exec 'taskkill /F /IM AirCastMouseServer.exe /T'
!macroend

!macro customInstall
  DetailPrint "Dang cai dat Apple Bonjour Service..."
  ExecWait 'msiexec.exe /i "$INSTDIR\resources\Bonjour64.msi" /qn /norestart'

  ; Xoa rule cu truoc khi them de khong bi nhan ban rule moi lan cap nhat
  DetailPrint "Dang cau hinh tuong lua Windows Defender cho AirPlay..."
  nsExec::Exec 'netsh advfirewall firewall delete rule name="AirCast Studio - AirPlay Ports"'
  nsExec::Exec 'netsh advfirewall firewall delete rule name="AirCast Studio - Bonjour Discovery"'
  nsExec::Exec 'netsh advfirewall firewall delete rule name="AirCast Studio - App"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="AirCast Studio - AirPlay Ports" dir=in action=allow protocol=TCP localport=5000,5050,7000,7100 profile=any'
  nsExec::Exec 'netsh advfirewall firewall add rule name="AirCast Studio - Bonjour Discovery" dir=in action=allow protocol=UDP localport=5353 profile=any'
  nsExec::Exec 'netsh advfirewall firewall add rule name="AirCast Studio - App" dir=in action=allow program="$INSTDIR\resources\bin\AirPlayServer.exe" enable=yes profile=any'
!macroend
