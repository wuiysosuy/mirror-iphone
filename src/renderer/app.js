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
  let debugMode = localStorage.getItem('aircast_debug_mode') === 'true';
  let autoCheckUpdate = localStorage.getItem('aircast_auto_update') !== 'false';
  let cachedUpdateInfo = null;
  let downloadedInstallerPath = null;
  let isDownloading = false;

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
        progressStatusTitle.textContent = '✓ Tải hoàn tất! Sẵn sàng nâng cấp.';
        progressPercentage.textContent = '100%';
        progressBarFill.style.width = '100%';
        progressTransferred.textContent = 'Đã tải xong toàn bộ file cài đặt.';
        progressSpeed.textContent = '';

        btnModalStartDownload.style.display = 'none';
        btnModalInstallNow.style.display = 'inline-flex';
        btnModalCancel.textContent = 'Đóng';

        appendLog({
          message: '✓ Tải bản cập nhật thành công! Nhấn "Cài Đặt & Khởi Động Lại" để hoàn tất.',
          type: 'success'
        });
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

