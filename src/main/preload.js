const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aircast', {
  // Server Controls
  startServer: (options) => ipcRenderer.invoke('server:start', options),
  stopServer: () => ipcRenderer.invoke('server:stop'),
  restartServer: (options) => ipcRenderer.invoke('server:restart', options),
  getStatus: () => ipcRenderer.invoke('server:get-status'),

  // QR & Mobile Portal
  getQrInfo: () => ipcRenderer.invoke('web:get-qr-info'),

  // Network & Diagnostics
  getNetworkInfo: () => ipcRenderer.invoke('network:get-info'),
  checkFirewall: () => ipcRenderer.invoke('firewall:check'),
  runFirewallHelper: () => ipcRenderer.invoke('firewall:run-helper'),
  checkBonjour: () => ipcRenderer.invoke('bonjour:check'),
  installBonjour: () => ipcRenderer.invoke('bonjour:install'),

  // Device Names
  getDeviceNames: () => ipcRenderer.invoke('settings:get-device-names'),
  saveDeviceNames: (data) => ipcRenderer.invoke('settings:save-device-names', data),

  // Listeners
  onStatusChange: (callback) => {
    const handler = (event, status) => callback(status);
    ipcRenderer.on('server:status-changed', handler);
    return () => ipcRenderer.removeListener('server:status-changed', handler);
  },
  onLog: (callback) => {
    const handler = (event, log) => callback(log);
    ipcRenderer.on('server:log', handler);
    return () => ipcRenderer.removeListener('server:log', handler);
  },
  onPhoneConnected: (callback) => {
    const handler = (event, info) => callback(info);
    ipcRenderer.on('phone:connected', handler);
    return () => ipcRenderer.removeListener('phone:connected', handler);
  },
  onPhoneDisconnected: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('phone:disconnected', handler);
    return () => ipcRenderer.removeListener('phone:disconnected', handler);
  },
  onCameraFrame: (callback) => {
    const handler = (event, frame) => callback(frame);
    ipcRenderer.on('phone:camera-frame', handler);
    return () => ipcRenderer.removeListener('phone:camera-frame', handler);
  },
  onPhotoReceived: (callback) => {
    const handler = (event, photo) => callback(photo);
    ipcRenderer.on('phone:photo-received', handler);
    return () => ipcRenderer.removeListener('phone:photo-received', handler);
  },

  // Window actions
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  openExternal: (url) => ipcRenderer.invoke('system:open-external', url),

  // Updater API
  updater: {
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdate: (data) => ipcRenderer.invoke('updater:download', data),
    cancelDownload: () => ipcRenderer.invoke('updater:cancel-download'),
    installUpdate: (filePath) => ipcRenderer.invoke('updater:install', filePath),
    onDownloadProgress: (callback) => {
      const handler = (event, progress) => callback(progress);
      ipcRenderer.on('updater:download-progress', handler);
      return () => ipcRenderer.removeListener('updater:download-progress', handler);
    }
  },

  // Bluetooth Mouse Control
  bluetooth: {
    checkCompatibility: () => ipcRenderer.invoke('bluetooth:check-compatibility'),
    getStatus: () => ipcRenderer.invoke('bluetooth:get-status'),
    start: (name) => ipcRenderer.invoke('bluetooth:start', name),
    stop: () => ipcRenderer.invoke('bluetooth:stop'),
    mouseMove: (dx, dy) => ipcRenderer.invoke('bluetooth:mouse-move', dx, dy),
    mouseDown: (button) => ipcRenderer.invoke('bluetooth:mouse-down', button),
    mouseUp: (button) => ipcRenderer.invoke('bluetooth:mouse-up', button),
    mouseWheel: (delta) => ipcRenderer.invoke('bluetooth:mouse-wheel', delta),
    tap: () => ipcRenderer.invoke('bluetooth:tap'),
    home: () => ipcRenderer.invoke('bluetooth:home'),
    swipe: (direction) => ipcRenderer.invoke('bluetooth:swipe', direction),
    setSensitivity: (val) => ipcRenderer.invoke('bluetooth:set-sensitivity', val),
    syncCursor: () => ipcRenderer.invoke('bluetooth:sync-cursor'),
    onStatusChange: (callback) => {
      const handler = (event, status) => callback(status);
      ipcRenderer.on('bluetooth:status-changed', handler);
      return () => ipcRenderer.removeListener('bluetooth:status-changed', handler);
    },
    onClientsChange: (callback) => {
      const handler = (event, count) => callback(count);
      ipcRenderer.on('bluetooth:clients-changed', handler);
      return () => ipcRenderer.removeListener('bluetooth:clients-changed', handler);
    },
    onLog: (callback) => {
      const handler = (event, log) => callback(log);
      ipcRenderer.on('bluetooth:log', handler);
      return () => ipcRenderer.removeListener('bluetooth:log', handler);
    }
  }
});

