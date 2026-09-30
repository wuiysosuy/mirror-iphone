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
  const checkCastMouseControl = document.getElementById('check-cast-mouse-control');
  const selectMouseSensitivity = document.getElementById('select-mouse-sensitivity');
  const mouseCaptureLayer = document.getElementById('mouse-capture-layer');
  const virtualCursorDot = document.getElementById('virtual-cursor-dot');

  // Bluetooth Mouse Elements
  const headerBtMouseBadge = document.getElementById('header-bt-mouse-badge');
  const headerBtMouseDot = document.getElementById('header-bt-mouse-dot');
  const headerBtMouseText = document.getElementById('header-bt-mouse-text');
  const btMouseStatusPill = document.getElementById('bt-mouse-status-pill');
  const btnToggleBtMouse = document.getElementById('btn-toggle-bt-mouse');
  const btnToggleBtMouseText = document.getElementById('btn-toggle-bt-mouse-text');
  const btCompatBanner = document.getElementById('bt-compat-banner');
  const btCompatSummaryText = document.getElementById('bt-compat-summary-text');
  const btCompatChecklist = document.getElementById('bt-compat-checklist');
  const btCompatRecommendations = document.getElementById('bt-compat-recommendations');
  const btnRecheckBt = document.getElementById('btn-recheck-bt');

  let btIsCompatible = true;
  let btCompatibilityInfo = null;

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
  const inputMouseName = document.getElementById('input-mouse-name');
  const valMouseName = document.getElementById('val-mouse-name');
  const guideMouseNameCode = document.getElementById('guide-mouse-name-code');
  const btnQuickEditPc = document.getElementById('btn-quick-edit-pc');
  const btnQuickEditMouse = document.getElementById('btn-quick-edit-mouse');
  const selectQuality = document.getElementById('select-quality');
  const checkDebugMode = document.getElementById('check-debug-mode');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnRestartServer = document.getElementById('btn-restart-server');

  // Updater Elements
  const btnCheckUpdate = document.getElementById('btn-check-update');
  const headerUpdateBadge = document.getElementById('header-update-badge');
  const globalUpdateBanner = document.getElementById('global-update-banner');
  const bannerNewVersion = document.getElementById('banner-new-version');
  const bannerReleaseDesc = document.getElementById('banner-release-desc');
  const btnBannerViewUpdate = document.getElementById('btn-banner-view-update');
  const btnBannerDismiss = document.getElementById('btn-banner-dismiss');

  const sidebarVersionNumber = document.getElementById('sidebar-version-number');
  const btnSidebarCheckUpdate = document.getElementById('btn-sidebar-check-update');

  const settingsUpdatePill = document.getElementById('settings-update-pill');
  const settingsCurrentVerDesc = document.getElementById('settings-current-ver-desc');
  const settingsCurrentVersionTag = document.getElementById('settings-current-version-tag');
  const checkAutoUpdate = document.getElementById('check-auto-update');
  const btnOpenGithubRepo = document.getElementById('btn-open-github-repo');
  const updateStatusIcon = document.getElementById('update-status-icon');
  const updateStatusMessage = document.getElementById('update-status-message');
  const btnSettingsCheckUpdate = document.getElementById('btn-settings-check-update');
  const spinCheckUpdate = document.getElementById('spin-check-update');
  const btnTextCheckUpdate = document.getElementById('btn-text-check-update');
  const btnSettingsUpdateNow = document.getElementById('btn-settings-update-now');

  // Update Modal Elements
  const updateModal = document.getElementById('update-modal');
  const btnCloseUpdateModal = document.getElementById('btn-close-update-modal');
  const modalNewVersionTag = document.getElementById('modal-new-version-tag');
  const modalCurrentVersion = document.getElementById('modal-current-version');
  const modalReleaseNotes = document.getElementById('modal-release-notes');
  const downloadProgressBox = document.getElementById('download-progress-box');
  const progressStatusTitle = document.getElementById('progress-status-title');
  const progressPercentage = document.getElementById('progress-percentage');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressTransferred = document.getElementById('progress-transferred');
  const progressSpeed = document.getElementById('progress-speed');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalOpenGithub = document.getElementById('btn-modal-open-github');
  const btnModalStartDownload = document.getElementById('btn-modal-start-download');
  const btnModalDownloadText = document.getElementById('btn-modal-download-text');
  const btnModalInstallNow = document.getElementById('btn-modal-install-now');

  // Local State
  let currentServerState = 'stopped';
  let deviceName = localStorage.getItem('aircast_device_name') || 'AirCast-PC';
  let mouseName = localStorage.getItem('aircast_mouse_name') || 'AirCast Mouse';
  let debugMode = localStorage.getItem('aircast_debug_mode') === 'true';
  let autoCheckUpdate = localStorage.getItem('aircast_auto_update') !== 'false';
  let cachedUpdateInfo = null;
  let downloadedInstallerPath = null;
  let isDownloading = false;

  // Bluetooth Mouse State
  let btMouseState = 'stopped';
  let btConnectedClients = 0;
  let mouseSensitivity = parseFloat(localStorage.getItem('aircast_mouse_sens') || '1.2');
  let isMouseControlActive = true;
  if (selectMouseSensitivity) selectMouseSensitivity.value = mouseSensitivity.toString();

  if (inputDeviceName) inputDeviceName.value = deviceName;
  if (inputMouseName) inputMouseName.value = mouseName;
  checkDebugMode.checked = debugMode;
  updateDeviceNameUI(deviceName);
  updateMouseNameUI(mouseName);

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
    if (valDeviceName) valDeviceName.textContent = name;
    if (guideDeviceNameCode) guideDeviceNameCode.textContent = name;
    if (mockupDeviceName) mockupDeviceName.textContent = name;
    if (inputDeviceName) inputDeviceName.value = name;
  }

  function updateMouseNameUI(name) {
    if (valMouseName) valMouseName.textContent = name;
    if (guideMouseNameCode) guideMouseNameCode.textContent = name;
    if (inputMouseName) inputMouseName.value = name;
  }

  // Load persistent device names from backend config
  async function loadDeviceNamesFromBackend() {
    if (window.aircast && window.aircast.getDeviceNames) {
      try {
        const res = await window.aircast.getDeviceNames();
        if (res && res.airplayName) {
          deviceName = res.airplayName;
          localStorage.setItem('aircast_device_name', deviceName);
          updateDeviceNameUI(deviceName);
        }
      } catch (e) {
        console.warn('Lỗi đọc tên thiết bị từ backend:', e);
      }
    }
    updateMouseNameUI(mouseName);
  }
  loadDeviceNamesFromBackend();

  // Quick Edit Buttons on Dashboard
  function switchToSettingsAndFocus(inputId) {
    const settingsBtn = document.querySelector('.nav-item[data-tab="tab-settings"]');
    if (settingsBtn) settingsBtn.click();
    const input = document.getElementById(inputId);
    if (input) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 150);
    }
  }

  if (btnQuickEditPc) {
    btnQuickEditPc.addEventListener('click', () => switchToSettingsAndFocus('input-device-name'));
  }

  if (btnQuickEditMouse) {
    btnQuickEditMouse.addEventListener('click', () => switchToSettingsAndFocus('input-mouse-name'));
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

  if (btnInstallBonjourQuick) btnInstallBonjourQuick.addEventListener('click', handleInstallBonjour);
  if (btnInstallBonjourDiag) btnInstallBonjourDiag.addEventListener('click', handleInstallBonjour);

  // Toggle Server
  if (btnToggleServer) {
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
  }

  // Copy QR Link
  if (boxQrLink) {
    boxQrLink.addEventListener('click', () => {
      const url = txtQrUrl ? txtQrUrl.textContent : '';
      if (url) {
        navigator.clipboard.writeText(url);
        const original = txtQrUrl.textContent;
        txtQrUrl.textContent = '✓ Đã sao chép liên kết!';
        setTimeout(() => {
          txtQrUrl.textContent = original;
        }, 1500);
      }
    });
  }

  // Copy IP on chip
  if (chipIpAddress) {
    chipIpAddress.addEventListener('click', () => {
      const ip = valIpAddress ? valIpAddress.textContent : '';
      if (ip && ip !== '127.0.0.1') {
        navigator.clipboard.writeText(ip);
        const originalText = headerIpText.textContent;
        headerIpText.textContent = '✓ Đã sao chép IP!';
        setTimeout(() => {
          headerIpText.textContent = originalText;
        }, 1500);
      }
    });
  }

  // Clear Logs
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      if (logsContainer) logsContainer.innerHTML = '<div class="log-line info">[Hệ Thống] Đã làm sạch nhật ký.</div>';
    });
  }

  // Close Live Cast
  if (btnCloseCast && liveCastContainer) {
    btnCloseCast.addEventListener('click', () => {
      liveCastContainer.style.display = 'none';
    });
  }

  // Fix Firewall
  if (btnFixFirewall) {
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
  }

  // Refresh Button
  if (btnRefreshInfo) {
    btnRefreshInfo.addEventListener('click', () => {
      refreshNetwork();
      appendLog({ message: 'Đã làm mới thông tin mạng, Bonjour & mã QR.', type: 'info' });
    });
  }

  // Save Settings
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', async () => {
      const newName = inputDeviceName ? (inputDeviceName.value.trim() || 'AirCast-PC') : 'AirCast-PC';
      const newMouse = inputMouseName ? (inputMouseName.value.trim() || 'AirCast Mouse') : 'AirCast Mouse';
      debugMode = checkDebugMode ? checkDebugMode.checked : false;

      const oldDeviceName = deviceName;
      const oldMouseName = mouseName;

      deviceName = newName;
      mouseName = newMouse;

      localStorage.setItem('aircast_device_name', deviceName);
      localStorage.setItem('aircast_mouse_name', mouseName);
      localStorage.setItem('aircast_debug_mode', debugMode.toString());

      updateDeviceNameUI(deviceName);
      updateMouseNameUI(mouseName);

      // Lưu trực tiếp vào file cấu hình airplay_settings.ini ở backend
      if (window.aircast && window.aircast.saveDeviceNames) {
        await window.aircast.saveDeviceNames({ airplayName: deviceName, mouseName: mouseName });
      }

      appendLog({
        message: `✓ Đã lưu cài đặt tên thiết bị: Máy tính = "${deviceName}", Chuột = "${mouseName}"`,
        type: 'success'
      });

      // Nếu máy chủ AirPlay đang chạy mà đổi tên, tự khởi động lại để phát tên mới
      if (currentServerState === 'running' && oldDeviceName !== deviceName) {
        appendLog({ message: 'Tên máy tính đã đổi. Đang tự khởi động lại dịch vụ AirPlay để cập nhật...', type: 'info' });
        await window.aircast.restartServer({ debug: debugMode });
      }

      // Nếu chuột Bluetooth đang bật mà đổi tên, tự khởi động lại Bluetooth để phát sóng tên mới
      if ((btMouseState === 'advertising' || btMouseState === 'connected') && oldMouseName !== mouseName) {
        appendLog({ message: 'Tên chuột Bluetooth đã đổi. Đang phát sóng lại với tên mới...', type: 'info' });
        await window.aircast.bluetooth.stop();
        setTimeout(() => {
          if (window.aircast && window.aircast.bluetooth) {
            window.aircast.bluetooth.start(mouseName);
          }
        }, 600);
      }

      alert(`Đã lưu thành công!\n\n• Tên máy tính (AirPlay): ${deviceName}\n• Tên chuột không dây: ${mouseName}`);
    });
  }

  // Restart Server Button
  if (btnRestartServer) {
    btnRestartServer.addEventListener('click', async () => {
      if (!window.aircast) return;
      appendLog({ message: 'Đang khởi động lại dịch vụ AirPlay...', type: 'info' });
      await window.aircast.restartServer({ debug: debugMode });
    });
  }

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

    const liveCastImg = document.getElementById('live-cast-img');
    const iphoneMockupScreen = document.getElementById('iphone-mockup-screen');

    window.aircast.onCameraFrame((frame) => {
      if (liveCastImg) {
        liveCastImg.style.display = 'block';
        liveCastImg.src = frame;
      }
      if (iphoneMockupScreen) {
        iphoneMockupScreen.style.display = 'none';
      }
    });

    window.aircast.onPhotoReceived((photoData) => {
      if (liveCastImg) {
        liveCastImg.style.display = 'block';
        liveCastImg.src = photoData;
      }
      if (iphoneMockupScreen) {
        iphoneMockupScreen.style.display = 'none';
      }
      appendLog({ message: 'Đã nhận và hiển thị 1 ảnh từ iPhone.', type: 'success' });
    });

    const initialStatus = await window.aircast.getStatus();
    updateStatusUI(initialStatus.status);
    if (initialStatus.logs && initialStatus.logs.length > 0) {
      initialStatus.logs.forEach(appendLog);
    }
  }

  // ==========================================================================
  // BLUETOOTH MOUSE CONTROL LOGIC
  // ==========================================================================
  function renderCompatibilityUI(info) {
    if (!info) return;

    // Đảm bảo đầy đủ danh sách kiểm tra tiếng Việt chuẩn không bị lỗi font
    if (!info.checks || info.checks.length === 0) {
      info.checks = [
        {
          title: 'Dịch vụ Bluetooth Windows (bthserv)',
          passed: !!info.hasBluetoothService,
          note: info.hasBluetoothService ? 'Đang chạy' : 'Chưa bật (vào services.msc để bật)'
        },
        {
          title: `Phần cứng: ${info.adapterName || 'Bluetooth Adapter'}`,
          passed: !!info.hasAdapter,
          note: info.hasAdapter ? 'Đã nhận diện phần cứng' : 'Không tìm thấy thiết bị'
        },
        {
          title: 'Trạng thái sóng Bluetooth',
          passed: info.radioState === 'On',
          note: info.radioState === 'On' ? 'Đang Bật (On)' : 'Đang Tắt (Cần gạt BẬT trong Settings)'
        },
        {
          title: 'Hỗ trợ Bluetooth Low Energy (BLE)',
          passed: !!info.isLowEnergySupported,
          note: info.isLowEnergySupported ? 'Có hỗ trợ' : 'Không hỗ trợ BLE'
        },
        {
          title: 'Chế độ thiết bị ngoại vi (BLE Peripheral Role)',
          passed: !!info.isPeripheralRoleSupported,
          note: info.isPeripheralRoleSupported ? 'Driver có hỗ trợ' : 'Driver không hỗ trợ'
        },
        {
          title: 'Khả năng phát sóng chuột thực tế (GATT HID)',
          passed: !!info.canBroadcastBle,
          note: info.canBroadcastBle ? 'Phát sóng thành công' : 'Bị Windows chặn (Lỗi Aborted)'
        }
      ];
    }

    if (!info.recommendations || info.recommendations.length === 0) {
      info.recommendations = [
        'Cắm thêm USB Bluetooth Dongle 5.0/5.3 chuyên dụng (như TP-Link UB500, Baseus BA04, Orico) để máy tính phát sóng chuột chuẩn BLE HID.',
        'Cập nhật driver card Bluetooth mới nhất từ trang chủ nhà sản xuất (Realtek/Intel).'
      ];
    }

    if (!info.reason) {
      info.reason = info.isCompatible
        ? 'Phần cứng Bluetooth đạt tiêu chuẩn 100%, sẵn sàng điều khiển chuột cho iPhone.'
        : 'Card Bluetooth tích hợp bị Windows chặn phát sóng ngoại vi (Lỗi Aborted). Vì vậy iPhone không thể dò thấy tín hiệu chuột Bluetooth.';
    }

    btCompatibilityInfo = info;
    btIsCompatible = !!info.isCompatible;

    if (!btIsCompatible) {
      if (btCompatBanner) {
        btCompatBanner.style.display = 'block';
      }
      if (btCompatSummaryText) {
        btCompatSummaryText.textContent = info.reason;
      }

      // Điền danh sách tiêu chí kiểm tra
      if (btCompatChecklist && Array.isArray(info.checks)) {
        btCompatChecklist.innerHTML = info.checks.map(chk => `
          <div class="compat-check-item ${chk.passed ? 'passed' : 'failed'}">
            <div class="check-icon">${chk.passed ? '✓' : '✗'}</div>
            <div class="check-details">
              <div class="check-title" title="${chk.title}">${chk.title}</div>
              <div class="check-note">${chk.note || (chk.passed ? 'Đạt yêu cầu' : 'Không đạt')}</div>
            </div>
          </div>
        `).join('');
      }

      // Điền các hành động khuyến nghị
      if (btCompatRecommendations && Array.isArray(info.recommendations)) {
        btCompatRecommendations.innerHTML = info.recommendations.map(rec => `
          <li>${rec}</li>
        `).join('');
      }

      // Khóa nút và trạng thái giao diện
      lockBtMouseUI(info.reason);
    } else {
      if (btCompatBanner) {
        btCompatBanner.style.display = 'none';
      }
      unlockBtMouseUI();
    }
  }

  function lockBtMouseUI(reason = '') {
    if (btnToggleBtMouse) {
      btnToggleBtMouse.classList.add('locked');
      btnToggleBtMouse.classList.remove('active');
      btnToggleBtMouse.title = reason || 'Tính năng Chuột Bluetooth bị khóa do phần cứng không đáp ứng.';
      if (btnToggleBtMouseText) {
        btnToggleBtMouseText.textContent = '🔒 Chuột Bluetooth Bị Khóa';
      }
    }
    if (btMouseStatusPill) {
      btMouseStatusPill.className = 'status-pill status-locked';
      btMouseStatusPill.textContent = 'Chưa Đủ Điều Kiện Phần Cứng ⚠️';
    }
    if (headerBtMouseBadge) {
      headerBtMouseBadge.className = 'bt-mouse-header-badge locked';
      if (headerBtMouseText) {
        headerBtMouseText.textContent = 'Chuột: Bị Khóa';
      }
    }
  }

  function unlockBtMouseUI() {
    if (btnToggleBtMouse) {
      btnToggleBtMouse.classList.remove('locked');
      btnToggleBtMouse.title = 'Bật hoặc tắt chuột Bluetooth để điều khiển iPhone';
    }
    updateBtMouseUI(btMouseState, btConnectedClients);
  }

  async function runBluetoothCompatibilityCheck(isManual = false) {
    if (!window.aircast || !window.aircast.bluetooth || !window.aircast.bluetooth.checkCompatibility) return;

    if (btnRecheckBt) {
      btnRecheckBt.classList.add('scanning');
      const textSpan = btnRecheckBt.querySelector('span');
      if (textSpan) textSpan.textContent = 'Đang quét...';
    }

    try {
      const res = await window.aircast.bluetooth.checkCompatibility();
      renderCompatibilityUI(res);
      if (isManual) {
        if (res.isCompatible) {
          alert('Tuyệt vời! Máy tính của bạn đã đáp ứng đầy đủ điều kiện để phát chuột Bluetooth cho iPhone.');
        } else {
          if (btCompatBanner) btCompatBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra phần cứng Bluetooth:', err);
    } finally {
      if (btnRecheckBt) {
        btnRecheckBt.classList.remove('scanning');
        const textSpan = btnRecheckBt.querySelector('span');
        if (textSpan) textSpan.textContent = 'Quét Lại Phần Cứng';
      }
    }
  }

  function updateBtMouseUI(status, clientCount = 0) {
    btMouseState = status;
    btConnectedClients = clientCount;

    // Nếu không tương thích hoặc trạng thái unsupported -> Luôn hiển thị trạng thái khóa
    if (!btIsCompatible || status === 'unsupported') {
      lockBtMouseUI(btCompatibilityInfo ? btCompatibilityInfo.reason : 'Phần cứng Bluetooth không hỗ trợ phát sóng BLE HID.');
      if (btCompatBanner) btCompatBanner.style.display = 'block';
      return;
    }

    if (status === 'connected') {
      if (btnToggleBtMouse) {
        btnToggleBtMouse.classList.remove('locked');
        btnToggleBtMouse.classList.add('active');
        btnToggleBtMouseText.textContent = 'Tắt Chuột Bluetooth';
      }
      if (btMouseStatusPill) {
        btMouseStatusPill.className = 'status-pill status-running';
        btMouseStatusPill.textContent = 'Đã Kết Nối iPhone ⚡ Sẵn Sàng Điều Khiển';
      }
      if (headerBtMouseBadge) {
        headerBtMouseBadge.className = 'bt-mouse-header-badge connected';
        headerBtMouseText.textContent = 'Chuột: Đã Kết Nối';
      }
    } else if (status === 'advertising') {
      if (btnToggleBtMouse) {
        btnToggleBtMouse.classList.remove('locked');
        btnToggleBtMouse.classList.add('active');
        btnToggleBtMouseText.textContent = 'Dừng Phát Sóng';
      }
      if (btMouseStatusPill) {
        btMouseStatusPill.className = 'status-pill status-starting';
        btMouseStatusPill.textContent = 'Đang Phát Sóng (Chờ iPhone Ghép Đôi)';
      }
      if (headerBtMouseBadge) {
        headerBtMouseBadge.className = 'bt-mouse-header-badge advertising';
        headerBtMouseText.textContent = 'Chuột: Chờ Kết Nối';
      }
    } else if (status === 'starting') {
      if (btnToggleBtMouse) {
        btnToggleBtMouse.classList.remove('locked');
        btnToggleBtMouse.classList.remove('active');
        btnToggleBtMouseText.textContent = 'Đang Khởi Động...';
      }
      if (btMouseStatusPill) {
        btMouseStatusPill.className = 'status-pill status-starting';
        btMouseStatusPill.textContent = 'Đang Bật Bluetooth...';
      }
      if (headerBtMouseBadge) {
        headerBtMouseBadge.className = 'bt-mouse-header-badge';
        headerBtMouseText.textContent = 'Chuột: Đang Bật...';
      }
    } else {
      if (btnToggleBtMouse) {
        btnToggleBtMouse.classList.remove('locked');
        btnToggleBtMouse.classList.remove('active');
        btnToggleBtMouseText.textContent = 'Bật Chuột Bluetooth';
      }
      if (btMouseStatusPill) {
        btMouseStatusPill.className = 'status-pill status-stopped';
        btMouseStatusPill.textContent = 'Chuột Bluetooth: Đang Tắt';
      }
      if (headerBtMouseBadge) {
        headerBtMouseBadge.className = 'bt-mouse-header-badge';
        headerBtMouseText.textContent = 'Chuột: Tắt';
      }
    }
  }

  // Toggle Bluetooth Mouse
  if (btnToggleBtMouse) {
    btnToggleBtMouse.addEventListener('click', async () => {
      if (!window.aircast || !window.aircast.bluetooth) return;

      // Nếu máy tính không đủ điều kiện -> Khóa lại và cảnh báo người dùng xem hướng dẫn
      if (!btIsCompatible || btMouseState === 'unsupported') {
        if (btCompatBanner) {
          btCompatBanner.style.display = 'block';
          btCompatBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        alert('⚠️ Tính năng Chuột Bluetooth đã bị khóa!\n\nLý do: Phần cứng Bluetooth trên máy tính chưa đủ điều kiện (bị Windows hủy phát sóng thiết bị ngoại vi BLE HID, khiến iPhone không thể dò thấy chuột).\n\nVui lòng xem hướng dẫn chi tiết trên màn hình để trang bị thêm USB Bluetooth 5.0/5.3.');
        return;
      }

      if (btMouseState === 'advertising' || btMouseState === 'connected' || btMouseState === 'starting') {
        updateBtMouseUI('starting');
        await window.aircast.bluetooth.stop();
      } else {
        updateBtMouseUI('starting');
        const res = await window.aircast.bluetooth.start(mouseName || 'AirCast Mouse');
        if (!res.success) {
          updateBtMouseUI('stopped');
          alert(`Không thể bật chuột Bluetooth: ${res.error}`);
        }
      }
    });
  }

  // Quét lại phần cứng Bluetooth khi bấm nút
  if (btnRecheckBt) {
    btnRecheckBt.addEventListener('click', () => {
      runBluetoothCompatibilityCheck(true);
    });
  }

  // Mouse Sensitivity setting
  if (selectMouseSensitivity) {
    selectMouseSensitivity.addEventListener('change', () => {
      mouseSensitivity = parseFloat(selectMouseSensitivity.value) || 1.2;
      localStorage.setItem('aircast_mouse_sens', mouseSensitivity.toString());
    });
  }

  // ==========================================================================
  // DIRECT ON-SCREEN IPHONE MIRROR & TOUCH CONTROL
  // ==========================================================================
  const iphoneTouchOverlay = document.getElementById('iphone-touch-overlay');
  const touchCursorRing = document.getElementById('touch-cursor-ring');
  const touchRippleEffect = document.getElementById('touch-ripple-effect');
  const iosHomeBarArea = document.getElementById('ios-home-bar-area');
  const iphoneMockupScreen = document.getElementById('iphone-mockup-screen');
  const iosClockTime = document.getElementById('ios-clock-time');

  const btnPointerLock = document.getElementById('btn-pointer-lock');
  const selectTouchpadSensitivity = document.getElementById('select-touchpad-sensitivity');

  const btnTpHome = document.getElementById('btn-tp-home');
  const btnTpAppSwitcher = document.getElementById('btn-tp-app-switcher');
  const btnTpClickRight = document.getElementById('btn-tp-click-right');
  const btnTpSwipeUp = document.getElementById('btn-tp-swipe-up');
  const btnTpSwipeDown = document.getElementById('btn-tp-swipe-down');
  const btnTpSwipeLeft = document.getElementById('btn-tp-swipe-left');
  const btnTpSwipeRight = document.getElementById('btn-tp-swipe-right');

  let isPointerLocked = false;
  mouseSensitivity = parseFloat(localStorage.getItem('aircast_mouse_sens') || '1.25');
  if (selectTouchpadSensitivity) selectTouchpadSensitivity.value = mouseSensitivity.toString();

  // Sensitivity selector
  if (selectTouchpadSensitivity) {
    selectTouchpadSensitivity.addEventListener('change', () => {
      mouseSensitivity = parseFloat(selectTouchpadSensitivity.value) || 1.25;
      localStorage.setItem('aircast_mouse_sens', mouseSensitivity.toString());
      if (window.aircast && window.aircast.bluetooth && window.aircast.bluetooth.setSensitivity) {
        window.aircast.bluetooth.setSensitivity(mouseSensitivity);
      }
    });
  }

  // Update clock on iOS screen
  function updateIosClock() {
    if (!iosClockTime) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    iosClockTime.textContent = `${hours}:${minutes}`;
  }
  updateIosClock();
  setInterval(updateIosClock, 30000);

  // Trigger visual ripple on tap
  function triggerRipple(x, y) {
    if (!touchRippleEffect) return;
    touchRippleEffect.style.left = `${x}px`;
    touchRippleEffect.style.top = `${y}px`;
    touchRippleEffect.classList.remove('animate-ripple');
    void touchRippleEffect.offsetWidth; // Force reflow
    touchRippleEffect.classList.add('animate-ripple');
  }

  // Direct On-Screen Mouse Interaction on iPhone Frame
  if (iphoneTouchOverlay) {
    iphoneTouchOverlay.addEventListener('mousemove', (e) => {
      // Update Apple-style AssistiveTouch pointer on the screen
      if (touchCursorRing) {
        touchCursorRing.style.left = `${e.offsetX}px`;
        touchCursorRing.style.top = `${e.offsetY}px`;
        touchCursorRing.style.display = 'block';
      }

      // Send relative motion to iPhone via Bluetooth HID
      if (window.aircast && window.aircast.bluetooth) {
        const dx = e.movementX * mouseSensitivity;
        const dy = e.movementY * mouseSensitivity;
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          window.aircast.bluetooth.mouseMove(dx, dy);
        }
      }
    });

    iphoneTouchOverlay.addEventListener('mouseenter', () => {
      if (touchCursorRing) touchCursorRing.style.display = 'block';
    });

    iphoneTouchOverlay.addEventListener('mouseleave', () => {
      if (touchCursorRing) touchCursorRing.style.display = 'none';
    });

    iphoneTouchOverlay.addEventListener('mousedown', (e) => {
      if (touchCursorRing) touchCursorRing.classList.add('active-click');
      triggerRipple(e.offsetX, e.offsetY);

      let btn = 'left';
      if (e.button === 2) btn = 'right';
      else if (e.button === 1) btn = 'middle';

      if (window.aircast && window.aircast.bluetooth) {
        window.aircast.bluetooth.mouseDown(btn);
      }
    });

    iphoneTouchOverlay.addEventListener('mouseup', (e) => {
      if (touchCursorRing) touchCursorRing.classList.remove('active-click');

      let btn = 'left';
      if (e.button === 2) btn = 'right';
      else if (e.button === 1) btn = 'middle';

      if (window.aircast && window.aircast.bluetooth) {
        window.aircast.bluetooth.mouseUp(btn);
      }
    });

    iphoneTouchOverlay.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * -1;
      if (window.aircast && window.aircast.bluetooth) {
        window.aircast.bluetooth.mouseWheel(delta);
      }
    }, { passive: false });

    iphoneTouchOverlay.addEventListener('contextmenu', (e) => {
      // Prevent browser right click menu so right-click is sent to iPhone (e.g. open menu/home)
      e.preventDefault();
    });
  }

  // iOS Home Bar Indicator (Click or swipe to go Home)
  if (iosHomeBarArea) {
    iosHomeBarArea.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        if (window.aircast.bluetooth.home) {
          window.aircast.bluetooth.home();
        } else {
          window.aircast.bluetooth.mouseDown('right');
          setTimeout(() => window.aircast.bluetooth.mouseUp('right'), 60);
        }
      }
    });
  }

  // Pointer Lock Mode (Capture entire mouse cursor without borders)
  if (btnPointerLock) {
    btnPointerLock.addEventListener('click', () => {
      if (!isPointerLocked) {
        document.body.requestPointerLock();
      } else {
        document.exitPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      isPointerLocked = document.pointerLockElement === document.body;
      if (isPointerLocked) {
        btnPointerLock.classList.add('locked');
        btnPointerLock.innerHTML = '<span>🔴 Đang Khóa Chuột (Bấm ESC để dừng)</span>';
      } else {
        btnPointerLock.classList.remove('locked');
        btnPointerLock.innerHTML = '<span>🎯 Khóa Chuột (ESC để thoát)</span>';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isPointerLocked && window.aircast && window.aircast.bluetooth) {
        const dx = e.movementX * mouseSensitivity;
        const dy = e.movementY * mouseSensitivity;
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          window.aircast.bluetooth.mouseMove(dx, dy);
        }
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (isPointerLocked && window.aircast && window.aircast.bluetooth) {
        let btn = 'left';
        if (e.button === 2) btn = 'right';
        else if (e.button === 1) btn = 'middle';
        window.aircast.bluetooth.mouseDown(btn);
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isPointerLocked && window.aircast && window.aircast.bluetooth) {
        let btn = 'left';
        if (e.button === 2) btn = 'right';
        else if (e.button === 1) btn = 'middle';
        window.aircast.bluetooth.mouseUp(btn);
      }
    });
  }

  // Side Navigation & Shortcut Buttons
  if (btnTpHome) {
    btnTpHome.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        if (window.aircast.bluetooth.home) {
          window.aircast.bluetooth.home();
        } else {
          window.aircast.bluetooth.mouseDown('right');
          setTimeout(() => window.aircast.bluetooth.mouseUp('right'), 60);
        }
      }
    });
  }

  if (btnTpAppSwitcher) {
    btnTpAppSwitcher.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        if (window.aircast.bluetooth.swipe) {
          window.aircast.bluetooth.swipe('up');
        } else {
          window.aircast.bluetooth.mouseWheel(-5);
        }
      }
    });
  }

  if (btnTpClickRight) {
    btnTpClickRight.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        window.aircast.bluetooth.mouseDown('right');
        setTimeout(() => window.aircast.bluetooth.mouseUp('right'), 50);
      }
    });
  }

  if (btnTpSwipeUp) {
    btnTpSwipeUp.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        if (window.aircast.bluetooth.swipe) {
          window.aircast.bluetooth.swipe('up');
        } else {
          window.aircast.bluetooth.mouseWheel(-5);
        }
      }
    });
  }

  if (btnTpSwipeDown) {
    btnTpSwipeDown.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        if (window.aircast.bluetooth.swipe) {
          window.aircast.bluetooth.swipe('down');
        } else {
          window.aircast.bluetooth.mouseWheel(5);
        }
      }
    });
  }

  if (btnTpSwipeLeft) {
    btnTpSwipeLeft.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        if (window.aircast.bluetooth.swipe) {
          window.aircast.bluetooth.swipe('left');
        }
      }
    });
  }

  if (btnTpSwipeRight) {
    btnTpSwipeRight.addEventListener('click', () => {
      if (window.aircast && window.aircast.bluetooth) {
        if (window.aircast.bluetooth.swipe) {
          window.aircast.bluetooth.swipe('right');
        }
      }
    });
  }

  // Bluetooth Backend Listeners
  if (window.aircast && window.aircast.bluetooth) {
    window.aircast.bluetooth.onStatusChange((status) => {
      updateBtMouseUI(status, btConnectedClients);
    });

    window.aircast.bluetooth.onClientsChange((count) => {
      updateBtMouseUI(count > 0 ? 'connected' : 'advertising', count);
    });

    window.aircast.bluetooth.onLog((log) => {
      appendLog(log);
    });

    // Check initial status
    try {
      const initialBt = await window.aircast.bluetooth.getStatus();
      if (initialBt) {
        if (initialBt.compatibilityInfo) {
          renderCompatibilityUI(initialBt.compatibilityInfo);
        }
        updateBtMouseUI(initialBt.status, initialBt.connectedClients || 0);
      }
    } catch (e) {
      console.error('Lỗi lấy trạng thái ban đầu chuột Bluetooth:', e);
    }

    // Tự động quét kiểm tra phần cứng Bluetooth của máy tính khi mở ứng dụng
    runBluetoothCompatibilityCheck();
  }

  // ==========================================================================
  // UPDATER LOGIC
  // ==========================================================================
  let appVersion = '1.0.0';

  if (window.aircast && window.aircast.updater) {
    try {
      appVersion = await window.aircast.updater.getVersion();
    } catch (e) {
      appVersion = '1.0.0';
    }
  }

  // Cập nhật phiên bản lên giao diện
  if (sidebarVersionNumber) sidebarVersionNumber.textContent = `v${appVersion}`;
  if (settingsCurrentVersionTag) settingsCurrentVersionTag.textContent = `v${appVersion}`;
  if (modalCurrentVersion) modalCurrentVersion.textContent = `v${appVersion}`;
  if (settingsCurrentVerDesc) settingsCurrentVerDesc.textContent = `Đang chạy AirCast Studio v${appVersion}`;
  if (checkAutoUpdate) checkAutoUpdate.checked = autoCheckUpdate;

  function setCheckingState(isChecking) {
    if (spinCheckUpdate) spinCheckUpdate.style.display = isChecking ? 'inline-block' : 'none';
    if (btnTextCheckUpdate) btnTextCheckUpdate.textContent = isChecking ? 'Đang Kiểm Tra...' : 'Kiểm Tra Cập Nhật Ngay';
    if (btnSettingsCheckUpdate) btnSettingsCheckUpdate.disabled = isChecking;
    if (btnCheckUpdate) {
      btnCheckUpdate.style.opacity = isChecking ? '0.7' : '1';
    }
  }

  function openUpdateModal(info) {
    if (!info) return;
    cachedUpdateInfo = info;

    modalNewVersionTag.textContent = `v${info.latestVersion}`;
    modalCurrentVersion.textContent = `v${info.currentVersion || appVersion}`;
    modalReleaseNotes.textContent = info.releaseNotes || '• Bản cập nhật mới cải thiện hiệu năng và ổn định hệ thống.';

    // Reset download progress UI
    downloadProgressBox.style.display = 'none';
    btnModalStartDownload.style.display = 'inline-flex';
    btnModalStartDownload.disabled = false;
    btnModalDownloadText.textContent = 'Tải & Cập Nhật Tự Động';
    btnModalInstallNow.style.display = 'none';
    btnModalCancel.textContent = 'Để Sau';

    updateModal.style.display = 'flex';
  }

  function closeUpdateModal() {
    if (isDownloading) {
      if (confirm('Bản cập nhật đang được tải xuống. Bạn có chắc muốn dừng tải?')) {
        if (window.aircast && window.aircast.updater) {
          window.aircast.updater.cancelDownload();
        }
        isDownloading = false;
        updateModal.style.display = 'none';
      }
    } else {
      updateModal.style.display = 'none';
    }
  }

  async function checkForUpdates(silent = false) {
    if (!window.aircast || !window.aircast.updater) {
      if (!silent) alert('Tính năng cập nhật chỉ khả dụng khi chạy trong ứng dụng AirCast Studio.');
      return;
    }

    setCheckingState(true);
    if (!silent) {
      appendLog({ message: 'Đang kiểm tra bản cập nhật mới từ GitHub...', type: 'info' });
    }

    try {
      const result = await window.aircast.updater.checkForUpdates();
      setCheckingState(false);

      if (result.hasUpdate) {
        cachedUpdateInfo = result;

        // Bật badge thông báo trên Header
        if (headerUpdateBadge) headerUpdateBadge.style.display = 'block';

        // Hiển thị Global Banner
        if (bannerNewVersion) bannerNewVersion.textContent = `v${result.latestVersion}`;
        if (bannerReleaseDesc && result.releaseNotes) {
          const firstLine = result.releaseNotes.split('\n')[0].replace(/^[•\-\*]\s*/, '');
          bannerReleaseDesc.textContent = firstLine || 'Bản nâng cấp với nhiều cải tiến mới.';
        }
        if (globalUpdateBanner) globalUpdateBanner.style.display = 'flex';

        // Cập nhật card trong Settings
        if (settingsUpdatePill) {
          settingsUpdatePill.className = 'update-status-pill has-update';
          settingsUpdatePill.textContent = `Bản Mới: v${result.latestVersion}`;
        }
        if (updateStatusIcon) {
          updateStatusIcon.className = 'update-status-icon alert';
          updateStatusIcon.textContent = '★';
        }
        if (updateStatusMessage) {
          updateStatusMessage.innerHTML = `<strong style="color:var(--accent-amber);">Đã tìm thấy bản cập nhật mới v${result.latestVersion}!</strong> Khuyên dùng nâng cấp để có trải nghiệm tốt nhất.`;
        }
        if (btnSettingsUpdateNow) {
          btnSettingsUpdateNow.style.display = 'inline-block';
          btnSettingsUpdateNow.textContent = `Tải Bản v${result.latestVersion}`;
        }

        appendLog({
          message: `🚀 Đã tìm thấy bản cập nhật mới v${result.latestVersion}! Vui lòng bấm Cập Nhật.`,
          type: 'success'
        });

        // Nếu người dùng chủ động bấm kiểm tra thì tự động mở modal
        if (!silent) {
          openUpdateModal(result);
        }
      } else {
        // Đang ở bản mới nhất
        if (headerUpdateBadge) headerUpdateBadge.style.display = 'none';
        if (globalUpdateBanner) globalUpdateBanner.style.display = 'none';

        if (settingsUpdatePill) {
          settingsUpdatePill.className = 'update-status-pill';
          settingsUpdatePill.textContent = 'Bản Mới Nhất';
        }
        if (updateStatusIcon) {
          updateStatusIcon.className = 'update-status-icon';
          updateStatusIcon.textContent = '✓';
        }
        if (updateStatusMessage) {
          updateStatusMessage.textContent = `Bạn đang sử dụng phiên bản mới nhất (v${appVersion}). Không có bản cập nhật nào mới hơn.`;
        }
        if (btnSettingsUpdateNow) btnSettingsUpdateNow.style.display = 'none';

        if (!silent) {
          appendLog({ message: `Hệ thống đang chạy phiên bản mới nhất (v${appVersion}).`, type: 'info' });
          alert(`Bạn đang sử dụng phiên bản mới nhất (v${appVersion})!`);
        }
      }
    } catch (err) {
      setCheckingState(false);
      if (!silent) {
        appendLog({ message: `Lỗi khi kiểm tra cập nhật: ${err.message}`, type: 'error' });
        alert(`Không thể kiểm tra cập nhật: ${err.message}`);
      }
    }
  }

  // Bắt đầu tải bản cập nhật
  async function startDownloadUpdate() {
    if (!cachedUpdateInfo || !cachedUpdateInfo.downloadUrl) {
      alert('Không tìm thấy link tải bản cập nhật.');
      return;
    }

    // Nếu link không phải file .exe (ví dụ link trang release GitHub)
    if (!cachedUpdateInfo.downloadUrl.toLowerCase().endsWith('.exe')) {
      if (window.aircast && window.aircast.openExternal) {
        window.aircast.openExternal(cachedUpdateInfo.githubUrl || cachedUpdateInfo.downloadUrl);
      }
      return;
    }

    isDownloading = true;
    downloadProgressBox.style.display = 'block';
    btnModalStartDownload.disabled = true;
    btnModalDownloadText.textContent = 'Đang Tải Xuống...';
    btnModalCancel.textContent = 'Hủy Tải';

    progressStatusTitle.textContent = 'Đang tải bản cập nhật...';
    progressPercentage.textContent = '0%';
    progressBarFill.style.width = '0%';
    progressTransferred.textContent = 'Bắt đầu kết nối...';
    progressSpeed.textContent = '';

    appendLog({ message: `Đang tải bản cập nhật v${cachedUpdateInfo.latestVersion}...`, type: 'info' });

    try {
      const res = await window.aircast.updater.downloadUpdate({
        downloadUrl: cachedUpdateInfo.downloadUrl,
        version: cachedUpdateInfo.latestVersion
      });

      isDownloading = false;

      if (res && res.success) {
        downloadedInstallerPath = res.filePath;
        progressStatusTitle.textContent = '✓ Tải hoàn tất! Đang tự động mở cài đặt...';
        progressPercentage.textContent = '100%';
        progressBarFill.style.width = '100%';
        progressTransferred.textContent = 'Đang tiến hành cài đặt nâng cấp...';
        progressSpeed.textContent = '';

        btnModalStartDownload.style.display = 'none';
        btnModalInstallNow.style.display = 'inline-flex';
        btnModalInstallNow.textContent = '⚡ Đang Khởi Chạy Cài Đặt...';
        btnModalInstallNow.disabled = true;
        btnModalCancel.textContent = 'Đóng';

        appendLog({
          message: '✓ Tải bản cập nhật thành công! Đang tự động mở trình cài đặt...',
          type: 'success'
        });

        // Tự động mở trình cài đặt nâng cấp ngay lập tức
        setTimeout(() => {
          installDownloadedUpdate();
        }, 1000);
      }
    } catch (err) {
      isDownloading = false;
      progressStatusTitle.textContent = `Lỗi tải file: ${err.message}`;
      btnModalStartDownload.disabled = false;
      btnModalDownloadText.textContent = 'Thử Lại';
      btnModalCancel.textContent = 'Đóng';
      appendLog({ message: `Tải bản cập nhật thất bại: ${err.message}`, type: 'error' });
    }
  }

  // Khởi chạy file cài đặt để cập nhật
  async function installDownloadedUpdate() {
    if (!downloadedInstallerPath) {
      alert('Không tìm thấy file cài đặt đã tải về.');
      return;
    }

    btnModalInstallNow.disabled = true;
    btnModalInstallNow.textContent = 'Đang khởi chạy...';
    appendLog({ message: 'Đang mở trình cài đặt bản mới...', type: 'info' });

    await window.aircast.updater.installUpdate(downloadedInstallerPath);
  }

  // Lắng nghe tiến trình tải từ backend
  if (window.aircast && window.aircast.updater) {
    window.aircast.updater.onDownloadProgress((prog) => {
      if (!isDownloading) return;
      const pct = prog.percent || 0;
      progressPercentage.textContent = `${pct}%`;
      progressBarFill.style.width = `${pct}%`;

      const receivedMb = (prog.receivedBytes / (1024 * 1024)).toFixed(1);
      const totalMb = prog.totalBytes > 0 ? (prog.totalBytes / (1024 * 1024)).toFixed(1) : '?';
      progressTransferred.textContent = `${receivedMb} MB / ${totalMb} MB`;

      const speedMb = (prog.speedBytesPerSec / (1024 * 1024)).toFixed(2);
      progressSpeed.textContent = `${speedMb} MB/s`;
    });
  }

  // Gắn sự kiện các nút Updater
  if (btnCheckUpdate) {
    btnCheckUpdate.addEventListener('click', () => {
      if (cachedUpdateInfo && cachedUpdateInfo.hasUpdate) {
        openUpdateModal(cachedUpdateInfo);
      } else {
        checkForUpdates(false);
      }
    });
  }

  if (btnSidebarCheckUpdate) {
    btnSidebarCheckUpdate.addEventListener('click', () => checkForUpdates(false));
  }

  if (btnSettingsCheckUpdate) {
    btnSettingsCheckUpdate.addEventListener('click', () => checkForUpdates(false));
  }

  if (btnSettingsUpdateNow) {
    btnSettingsUpdateNow.addEventListener('click', () => {
      if (cachedUpdateInfo) openUpdateModal(cachedUpdateInfo);
    });
  }

  if (btnBannerViewUpdate) {
    btnBannerViewUpdate.addEventListener('click', () => {
      if (cachedUpdateInfo) openUpdateModal(cachedUpdateInfo);
    });
  }

  if (btnBannerDismiss) {
    btnBannerDismiss.addEventListener('click', () => {
      if (globalUpdateBanner) globalUpdateBanner.style.display = 'none';
    });
  }

  if (btnOpenGithubRepo) {
    btnOpenGithubRepo.addEventListener('click', () => {
      const url = (cachedUpdateInfo && cachedUpdateInfo.githubUrl) || 'https://github.com/wuiysosuy/mirror-iphone';
      if (window.aircast && window.aircast.openExternal) {
        window.aircast.openExternal(url);
      }
    });
  }

  if (btnCloseUpdateModal) {
    btnCloseUpdateModal.addEventListener('click', closeUpdateModal);
  }

  if (btnModalCancel) {
    btnModalCancel.addEventListener('click', closeUpdateModal);
  }

  if (btnModalOpenGithub) {
    btnModalOpenGithub.addEventListener('click', () => {
      const url = (cachedUpdateInfo && cachedUpdateInfo.githubUrl) || 'https://github.com/wuiysosuy/mirror-iphone/releases';
      if (window.aircast && window.aircast.openExternal) {
        window.aircast.openExternal(url);
      }
    });
  }

  if (btnModalStartDownload) {
    btnModalStartDownload.addEventListener('click', startDownloadUpdate);
  }

  if (btnModalInstallNow) {
    btnModalInstallNow.addEventListener('click', installDownloadedUpdate);
  }

  if (checkAutoUpdate) {
    checkAutoUpdate.addEventListener('change', () => {
      autoCheckUpdate = checkAutoUpdate.checked;
      localStorage.setItem('aircast_auto_update', autoCheckUpdate.toString());
    });
  }

  // Initial Load
  refreshNetwork();
  loadQrInfo();

  // Tự động kiểm tra bản cập nhật sau 2 giây khi khởi động ứng dụng
  if (autoCheckUpdate) {
    setTimeout(() => {
      checkForUpdates(true);
    }, 2000);
  }
});

