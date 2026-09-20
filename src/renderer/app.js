document.addEventListener('DOMContentLoaded', async () => {
  // Navigation
  const navButtons = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  // Server UI Elements
  const btnToggleServer = document.getElementById('btn-toggle-server');
  const btnToggleText = document.getElementById('btn-toggle-text');
  const heroStatusPill = document.getElementById('hero-status-pill');
  const sidebarStatusDot = document.getElementById('sidebar-status-dot');
  const sidebarStatusTitle = document.getElementById('sidebar-status-title');
  const sidebarStatusDesc = document.getElementById('sidebar-status-desc');

  // Network Elements
  const chipIpAddress = document.getElementById('chip-ip-address');
  const headerIpText = document.getElementById('header-ip-text');
  const valIpAddress = document.getElementById('val-ip-address');
  const valDeviceName = document.getElementById('val-device-name');
  const guideDeviceNameCode = document.getElementById('guide-device-name-code');
  const mockupDeviceName = document.getElementById('mockup-device-name');
  const btnRefreshInfo = document.getElementById('btn-refresh-info');
  const adaptersContainer = document.getElementById('adapters-container');
  const phoneBadge = document.getElementById('phone-badge');

  // Bonjour Elements
  const bonjourAlertBanner = document.getElementById('bonjour-alert-banner');
  const btnInstallBonjourQuick = document.getElementById('btn-install-bonjour-quick');
  const bonjourStatusBox = document.getElementById('bonjour-status-box');
  const bonjourStatusBadge = document.getElementById('bonjour-status-badge');
  const bonjourStatusMsg = document.getElementById('bonjour-status-msg');
  const btnInstallBonjourDiag = document.getElementById('btn-install-bonjour-diag');

  // QR Code Elements
  const qrCodeImg = document.getElementById('qr-code-img');
  const txtQrUrl = document.getElementById('txt-qr-url');
  const boxQrLink = document.getElementById('box-qr-link');

  // Live Cast Elements
  const liveCastContainer = document.getElementById('live-cast-container');
  const liveCastImg = document.getElementById('live-cast-img');
  const castStreamTitle = document.getElementById('cast-stream-title');
  const btnCloseCast = document.getElementById('btn-close-cast');

  // Firewall Elements
  const firewallStatusBox = document.getElementById('firewall-status-box');
  const firewallStatusBadge = document.getElementById('firewall-status-badge');
  const firewallStatusMsg = document.getElementById('firewall-status-msg');
  const btnFixFirewall = document.getElementById('btn-fix-firewall');

  // Logs Elements
  const logsContainer = document.getElementById('logs-container');
  const btnClearLogs = document.getElementById('btn-clear-logs');

  // Settings Elements
  const inputDeviceName = document.getElementById('input-device-name');
  const selectQuality = document.getElementById('select-quality');
  const checkDebugMode = document.getElementById('check-debug-mode');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnRestartServer = document.getElementById('btn-restart-server');

  // Local State
  let currentServerState = 'stopped';
  let deviceName = localStorage.getItem('aircast_device_name') || 'AirCast-PC';
  let debugMode = localStorage.getItem('aircast_debug_mode') === 'true';

  inputDeviceName.value = deviceName;
  checkDebugMode.checked = debugMode;
  updateDeviceNameUI(deviceName);

  const tabMeta = {
    'tab-dashboard': {
      title: 'Bảng Điều Khiển',
      subtitle: 'Phản chiếu không dây màn hình & âm thanh iPhone qua AirPlay'
    },
    'tab-guide': {
      title: 'Hướng Dẫn Kết Nối',
      subtitle: 'Quét mã QR hoặc kết nối qua Trung tâm điều khiển iOS'
    },
    'tab-diagnostics': {
      title: 'Chẩn Đoán Tường Lửa & Bonjour',
      subtitle: 'Kiểm tra dịch vụ Apple Bonjour và cấu hình cổng Windows Defender'
    },
    'tab-settings': {
      title: 'Cài Đặt Hệ Thống',
      subtitle: 'Tùy chỉnh thông số hiển thị và dịch vụ AirPlay'
    }
  };

  // Tab Switch
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add('active');

      if (tabMeta[targetTab]) {
        pageTitle.textContent = tabMeta[targetTab].title;
        pageSubtitle.textContent = tabMeta[targetTab].subtitle;
      }
    });
  });

  function updateDeviceNameUI(name) {
    valDeviceName.textContent = name;
    guideDeviceNameCode.textContent = name;
    mockupDeviceName.textContent = name;
  }

  function updateStatusUI(status) {
    currentServerState = status;

    if (status === 'running') {
      btnToggleServer.classList.add('active');
      btnToggleText.textContent = 'Dừng Máy Chủ';

      heroStatusPill.className = 'status-pill status-running';
      heroStatusPill.textContent = 'Đang Phát Sóng (Online)';

      sidebarStatusDot.className = 'status-indicator-dot running';
      sidebarStatusTitle.textContent = 'Đang Hoạt Động';
      sidebarStatusDesc.textContent = 'Sẵn sàng nhận stream';
    } else if (status === 'starting') {
      btnToggleServer.classList.remove('active');
      btnToggleText.textContent = 'Đang Bật...';

      heroStatusPill.className = 'status-pill status-starting';
      heroStatusPill.textContent = 'Đang Khởi Động';

      sidebarStatusDot.className = 'status-indicator-dot';
      sidebarStatusTitle.textContent = 'Đang Khởi Động';
      sidebarStatusDesc.textContent = 'Chờ dịch vụ AirPlay';
    } else {
      btnToggleServer.classList.remove('active');
      btnToggleText.textContent = 'Bật Máy Chủ';

      heroStatusPill.className = 'status-pill status-stopped';
      heroStatusPill.textContent = 'Dịch Vụ Đang Tắt';

      sidebarStatusDot.className = 'status-indicator-dot';
      sidebarStatusTitle.textContent = 'Đã Tắt';
      sidebarStatusDesc.textContent = 'Nhấn Bật để kết nối';
    }
  }

  function appendLog(entry) {
    const line = document.createElement('div');
    line.className = `log-line ${entry.type || 'info'}`;
    line.textContent = `[${entry.timestamp || new Date().toLocaleTimeString()}] ${entry.message}`;
    logsContainer.appendChild(line);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  // Load QR Code Info
  async function loadQrInfo() {
    if (!window.aircast) return;
    try {
      const qrData = await window.aircast.getQrInfo();
      if (qrData) {
        if (qrData.qrCode) {
          qrCodeImg.src = qrData.qrCode;
        }
        if (qrData.url) {
          txtQrUrl.textContent = qrData.url;
        }
      }
    } catch (e) {
      console.error('Lỗi lấy QR:', e);
    }
  }

  // Check Bonjour Status
  async function checkBonjour() {
    if (!window.aircast) return;
    try {
      const bj = await window.aircast.checkBonjour();
      if (bj.installed && bj.running) {
        bonjourAlertBanner.style.display = 'none';
        bonjourStatusBox.className = 'firewall-status-box active';
        bonjourStatusBadge.textContent = '✓ Đang Hoạt Động';
        bonjourStatusMsg.textContent = 'Dịch vụ Apple Bonjour đã được cài đặt và đang chạy sẵn sàng cho AirPlay.';
      } else if (bj.installed && !bj.running) {
        bonjourAlertBanner.style.display = 'flex';
        bonjourStatusBox.className = 'firewall-status-box';
        bonjourStatusBadge.textContent = '! Dịch Vụ Đang Dừng';
        bonjourStatusMsg.textContent = 'Dịch vụ Bonjour đã cài nhưng chưa khởi động. Hãy khởi động lại máy tính hoặc chạy Bonjour Service.';
      } else {
        bonjourAlertBanner.style.display = 'flex';
        bonjourStatusBox.className = 'firewall-status-box';
        bonjourStatusBadge.textContent = '❌ Chưa Cài Đặt';
        bonjourStatusMsg.textContent = 'Chưa phát hiện Apple Bonjour trên máy tính. Hãy nhấn nút bên dưới để cài đặt (Bonjour64.msi).';
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Refresh Network Info
  async function refreshNetwork() {
    if (!window.aircast) return;

    headerIpText.textContent = 'Đang quét IP...';
    try {
      const netInfo = await window.aircast.getNetworkInfo();
      headerIpText.textContent = `Wi-Fi: ${netInfo.primaryIp}`;
      valIpAddress.textContent = netInfo.primaryIp;

      adaptersContainer.innerHTML = '';
      if (netInfo.allInterfaces && netInfo.allInterfaces.length > 0) {
        netInfo.allInterfaces.forEach((adapter) => {
          const item = document.createElement('div');
          item.className = 'adapter-item';
          item.innerHTML = `
            <span class="adapter-name">${adapter.interface}</span>
            <span class="adapter-ip">${adapter.ip}</span>
          `;
          adaptersContainer.appendChild(item);
        });
      }

      loadQrInfo();
      checkFirewallStatus();
      checkBonjour();
    } catch (err) {
      headerIpText.textContent = 'Lỗi quét mạng';
      console.error(err);
    }
  }

  async function checkFirewallStatus() {
    if (!window.aircast) return;
    try {
      const fw = await window.aircast.checkFirewall();
      if (fw.configured) {
        firewallStatusBox.className = 'firewall-status-box active';
        firewallStatusBadge.textContent = '✓ Đã Cấu Hình';
        firewallStatusMsg.textContent = 'Tường lửa Windows Defender đã được mở cho các cổng AirPlay & QR Portal.';
      } else {
        firewallStatusBox.className = 'firewall-status-box';
        firewallStatusBadge.textContent = '! Cần Cấu Hình';
        firewallStatusMsg.textContent = 'Chưa phát hiện quy tắc tường lửa tự động. Nhấn nút bên dưới để cấp quyền.';
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Install Bonjour
  async function handleInstallBonjour() {
    if (!window.aircast) return;
    appendLog({ message: 'Đang mở trình cài đặt Apple Bonjour (Bonjour64.msi)...', type: 'info' });
    await window.aircast.installBonjour();
    appendLog({ message: 'Vui lòng hoàn tất các bước "Next -> Finish" trên cửa sổ cài đặt Bonjour.', type: 'warn' });
  }

  btnInstallBonjourQuick.addEventListener('click', handleInstallBonjour);
  btnInstallBonjourDiag.addEventListener('click', handleInstallBonjour);

  // Toggle Server
  btnToggleServer.addEventListener('click', async () => {
    if (!window.aircast) return;

    if (currentServerState === 'running' || currentServerState === 'starting') {
      updateStatusUI('starting');
      await window.aircast.stopServer();
    } else {
      updateStatusUI('starting');
      const res = await window.aircast.startServer({ debug: debugMode });
      if (!res.success) {
        updateStatusUI('stopped');
        alert(`Không thể khởi chạy: ${res.error}`);
      }
    }
  });

  // Copy QR Link
  boxQrLink.addEventListener('click', () => {
    const url = txtQrUrl.textContent;
    if (url) {
      navigator.clipboard.writeText(url);
      const original = txtQrUrl.textContent;
      txtQrUrl.textContent = '✓ Đã sao chép liên kết!';
      setTimeout(() => {
        txtQrUrl.textContent = original;
      }, 1500);
    }
  });

  // Copy IP on chip
  chipIpAddress.addEventListener('click', () => {
    const ip = valIpAddress.textContent;
    if (ip && ip !== '127.0.0.1') {
      navigator.clipboard.writeText(ip);
      const originalText = headerIpText.textContent;
      headerIpText.textContent = '✓ Đã sao chép IP!';
      setTimeout(() => {
        headerIpText.textContent = originalText;
      }, 1500);
    }
  });

  // Clear Logs
  btnClearLogs.addEventListener('click', () => {
    logsContainer.innerHTML = '<div class="log-line info">[Hệ Thống] Đã làm sạch nhật ký.</div>';
  });

  // Close Live Cast
  btnCloseCast.addEventListener('click', () => {
    liveCastContainer.style.display = 'none';
  });

  // Fix Firewall
  btnFixFirewall.addEventListener('click', async () => {
    if (!window.aircast) return;
    appendLog({ message: 'Đang yêu cầu cấp quyền Tường Lửa qua Windows...', type: 'info' });
    const res = await window.aircast.runFirewallHelper();
    if (res.success) {
      appendLog({ message: 'Đã mở script cấu hình Tường Lửa. Nhấn "Yes" nếu có thông báo UAC.', type: 'success' });
      setTimeout(checkFirewallStatus, 4000);
    } else {
      appendLog({ message: `Lỗi: ${res.error}`, type: 'error' });
    }
  });

  // Refresh Button
  btnRefreshInfo.addEventListener('click', () => {
    refreshNetwork();
    appendLog({ message: 'Đã làm mới thông tin mạng, Bonjour & mã QR.', type: 'info' });
  });

  // Save Settings
  btnSaveSettings.addEventListener('click', () => {
    const newName = inputDeviceName.value.trim() || 'AirCast-PC';
    debugMode = checkDebugMode.checked;

    localStorage.setItem('aircast_device_name', newName);
    localStorage.setItem('aircast_debug_mode', debugMode.toString());

    updateDeviceNameUI(newName);
    alert('Đã lưu cài đặt thành công!');
  });

  // Restart Server Button
  btnRestartServer.addEventListener('click', async () => {
    if (!window.aircast) return;
    appendLog({ message: 'Đang khởi động lại dịch vụ AirPlay...', type: 'info' });
    await window.aircast.restartServer({ debug: debugMode });
  });

  // Listeners from Backend
  if (window.aircast) {
    window.aircast.onStatusChange(updateStatusUI);
    window.aircast.onLog(appendLog);

    window.aircast.onPhoneConnected((info) => {
      phoneBadge.style.display = 'flex';
      appendLog({
        message: `📱 iPhone đã quét mã QR và kết nối từ ${info.ip}!`,
        type: 'success'
      });
    });

    window.aircast.onPhoneDisconnected(() => {
      phoneBadge.style.display = 'none';
      appendLog({
        message: '📱 iPhone đã ngắt kết nối trang di động.',
        type: 'warn'
      });
    });

    window.aircast.onCameraFrame((frame) => {
      liveCastContainer.style.display = 'block';
      castStreamTitle.textContent = 'Camera iPhone Trực Tiếp (Live Stream)';
      liveCastImg.src = frame;
    });

    window.aircast.onPhotoReceived((photoData) => {
      liveCastContainer.style.display = 'block';
      castStreamTitle.textContent = 'Trình Chiếu Ảnh Từ iPhone';
      liveCastImg.src = photoData;
      appendLog({ message: 'Đã nhận và hiển thị 1 ảnh từ iPhone.', type: 'success' });
    });

    const initialStatus = await window.aircast.getStatus();
    updateStatusUI(initialStatus.status);
    if (initialStatus.logs && initialStatus.logs.length > 0) {
      initialStatus.logs.forEach(appendLog);
    }
  }

  // Initial Load
  refreshNetwork();
  loadQrInfo();
});
