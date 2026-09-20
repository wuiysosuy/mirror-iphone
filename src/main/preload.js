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
  openExternal: (url) => ipcRenderer.invoke('system:open-external', url)
});
