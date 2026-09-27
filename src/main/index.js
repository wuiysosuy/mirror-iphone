const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const ServerManager = require('./server-manager');
const MobileWebServer = require('./web-server');
const AppUpdater = require('./updater');
const BluetoothMouseManager = require('./bluetooth-mouse-manager');
const { getNetworkInfo, checkFirewallStatus, checkBonjourStatus } = require('./network-utils');

function getBaseDir() {
  return app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '../../');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let serverManager = null;
let appUpdater = null;
let bluetoothMouseManager = null;
const mobileWebServer = new MobileWebServer(5050);
let qrInfo = null;

function createWindow() {
  serverManager = new ServerManager(getBaseDir());

  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 920,
    minHeight: 650,
    title: 'AirCast Studio - Phản Chiếu Màn Hình iPhone Lên Máy Tính',
    backgroundColor: '#0a0d14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: true,
    show: false
  });

  appUpdater = new AppUpdater(mainWindow, {
    owner: 'wuiysosuy',
    repo: 'mirror-iphone'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  serverManager.onStatusChange = (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('server:status-changed', status);
    }
  };

  serverManager.onLog = (logEntry) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('server:log', logEntry);
    }
  };

  mobileWebServer.onPhoneConnected = (clientInfo) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('phone:connected', clientInfo);
    }
  };

  mobileWebServer.onPhoneDisconnected = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('phone:disconnected');
    }
  };

  mobileWebServer.onFrameReceived = (frame) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('phone:camera-frame', frame);
    }
  };

  mobileWebServer.onPhotoReceived = (photoData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('phone:photo-received', photoData);
    }
  };

  bluetoothMouseManager = new BluetoothMouseManager(getBaseDir());

  bluetoothMouseManager.onStatusChange = (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bluetooth:status-changed', status);
    }
  };

  bluetoothMouseManager.onClientsChange = (count) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bluetooth:clients-changed', count);
    }
  };

  bluetoothMouseManager.onLog = (logEntry) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bluetooth:log', logEntry);
    }
  };

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('server:start', async (event, options) => {
  if (!serverManager) serverManager = new ServerManager(getBaseDir());
  return serverManager.start(options);
});

ipcMain.handle('server:stop', async () => {
  if (serverManager) return serverManager.stop();
  return { success: true };
});

ipcMain.handle('server:restart', async (event, options) => {
  if (serverManager) return serverManager.restart(options);
  return { success: false };
});

ipcMain.handle('server:get-status', async () => {
  if (serverManager) return serverManager.getStatus();
  return { status: 'stopped', isRunning: false, logs: [] };
});

ipcMain.handle('network:get-info', async () => {
  return getNetworkInfo();
});

ipcMain.handle('bonjour:check', async () => {
  return checkBonjourStatus();
});

ipcMain.handle('bonjour:install', async () => {
  const msiPath = path.join(getBaseDir(), 'Bonjour64.msi');
  shell.openPath(msiPath);
  return { success: true };
});

ipcMain.handle('web:get-qr-info', async () => {
  if (qrInfo) return qrInfo;
  const netInfo = getNetworkInfo();
  qrInfo = await mobileWebServer.start(netInfo.primaryIp);
  return qrInfo;
});

ipcMain.handle('firewall:check', async () => {
  return checkFirewallStatus();
});

ipcMain.handle('firewall:run-helper', async () => {
  const scriptPath = path.join(getBaseDir(), 'scripts', 'allow-firewall.bat');
  return new Promise((resolve) => {
    const command = `powershell -Command "Start-Process cmd -ArgumentList '/c \"\"${scriptPath}\"\"' -Verb RunAs"`;
    exec(command, (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, message: 'Đã yêu cầu quyền Administrator cấu hình Firewall' });
      }
    });
  });
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('system:open-external', (event, url) => {
  shell.openExternal(url);
});

// Updater Handlers
ipcMain.handle('updater:get-version', () => {
  return app.getVersion() || '1.0.0';
});

ipcMain.handle('updater:check', async () => {
  if (!appUpdater) {
    appUpdater = new AppUpdater(mainWindow, { owner: 'wuiysosuy', repo: 'mirror-iphone' });
  }
  return appUpdater.checkForUpdates();
});

ipcMain.handle('updater:download', async (event, data) => {
  if (!appUpdater) {
    appUpdater = new AppUpdater(mainWindow, { owner: 'wuiysosuy', repo: 'mirror-iphone' });
  }
  const downloadUrl = (data && data.downloadUrl) || data;
  const version = (data && data.version) || 'new';
  return appUpdater.downloadUpdate(downloadUrl, version);
});

ipcMain.handle('updater:cancel-download', async () => {
  if (appUpdater) return appUpdater.cancelDownload();
  return { success: true };
});

ipcMain.handle('updater:install', async (event, filePath) => {
  if (appUpdater) return appUpdater.installUpdate(filePath);
  return { success: false, error: 'Chưa khởi tạo AppUpdater' };
});

// Bluetooth Mouse Handlers
ipcMain.handle('bluetooth:get-status', async () => {
  if (bluetoothMouseManager) return bluetoothMouseManager.getStatus();
  return { status: 'stopped', connectedClients: 0 };
});

ipcMain.handle('bluetooth:start', async (event, name) => {
  if (!bluetoothMouseManager) bluetoothMouseManager = new BluetoothMouseManager(getBaseDir());
  return bluetoothMouseManager.start(name);
});

ipcMain.handle('bluetooth:stop', async () => {
  if (bluetoothMouseManager) return bluetoothMouseManager.stop();
  return { success: true };
});

ipcMain.handle('bluetooth:mouse-move', (event, dx, dy) => {
  if (bluetoothMouseManager) bluetoothMouseManager.sendMouseMove(dx, dy);
});

ipcMain.handle('bluetooth:mouse-down', (event, button) => {
  if (bluetoothMouseManager) bluetoothMouseManager.sendMouseDown(button);
});

ipcMain.handle('bluetooth:mouse-up', (event, button) => {
  if (bluetoothMouseManager) bluetoothMouseManager.sendMouseUp(button);
});

ipcMain.handle('bluetooth:mouse-wheel', (event, delta) => {
  if (bluetoothMouseManager) bluetoothMouseManager.sendMouseWheel(delta);
});

ipcMain.handle('bluetooth:tap', () => {
  if (bluetoothMouseManager) bluetoothMouseManager.sendTap();
});

ipcMain.handle('bluetooth:home', () => {
  if (bluetoothMouseManager) bluetoothMouseManager.sendHome();
});

ipcMain.handle('bluetooth:swipe', (event, direction) => {
  if (bluetoothMouseManager) bluetoothMouseManager.sendSwipe(direction);
});

ipcMain.handle('bluetooth:set-sensitivity', (event, val) => {
  if (bluetoothMouseManager) bluetoothMouseManager.setSensitivity(val);
});

ipcMain.handle('bluetooth:sync-cursor', () => {
  if (bluetoothMouseManager) bluetoothMouseManager.syncCursor();
});

// App Lifecycle
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  const netInfo = getNetworkInfo();
  try {
    qrInfo = await mobileWebServer.start(netInfo.primaryIp);
  } catch (e) {
    console.error('Không thể khởi động mobile server:', e);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverManager) serverManager.stop();
  if (bluetoothMouseManager) bluetoothMouseManager.terminate();
  mobileWebServer.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverManager) serverManager.stop();
  if (bluetoothMouseManager) bluetoothMouseManager.terminate();
  mobileWebServer.stop();
});
