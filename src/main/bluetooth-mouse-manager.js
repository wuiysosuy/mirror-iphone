const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

class BluetoothMouseManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.binDir = path.join(baseDir, 'bin');
    this.exePath = path.join(this.binDir, 'AirCastMouseServer.exe');
    this.process = null;
    this.status = 'stopped'; // 'stopped' | 'starting' | 'advertising' | 'connected' | 'error'
    this.connectedClients = 0;
    this.adapterInfo = null;
    this.onStatusChange = null;
    this.onLog = null;
    this.onClientsChange = null;
  }

  log(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, message: msg, type };
    if (this.onLog) {
      this.onLog(entry);
    }
  }

  setStatus(newStatus) {
    this.status = newStatus;
    if (this.onStatusChange) {
      this.onStatusChange(newStatus);
    }
  }

  ensureProcessRunning() {
    if (this.process && !this.process.killed) {
      return true;
    }

    if (!fs.existsSync(this.exePath)) {
      const err = `Không tìm thấy file AirCastMouseServer.exe tại: ${this.exePath}`;
      this.log(err, 'error');
      this.setStatus('error');
      return false;
    }

    try {
      this.process = spawn(this.exePath, [], {
        cwd: this.binDir,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const rl = readline.createInterface({
        input: this.process.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        try {
          const data = JSON.parse(line);
          this.handleServerEvent(data);
        } catch (e) {
          // Non-JSON output
          if (line.trim()) {
            this.log(`[BT Server] ${line.trim()}`, 'info');
          }
        }
      });

      this.process.stderr.on('data', (chunk) => {
        const text = chunk.toString().trim();
        if (text) {
          this.log(`[BT Server Err] ${text}`, 'warn');
        }
      });

      this.process.on('close', (code) => {
        this.log(`Tiến trình chuột Bluetooth đã dừng (Mã: ${code})`, code === 0 ? 'info' : 'warn');
        this.process = null;
        this.connectedClients = 0;
        this.setStatus('stopped');
      });

      this.process.on('error', (err) => {
        this.log(`Lỗi tiến trình chuột Bluetooth: ${err.message}`, 'error');
        this.setStatus('error');
      });

      return true;
    } catch (err) {
      this.log(`Không thể khởi động chuột Bluetooth: ${err.message}`, 'error');
      this.setStatus('error');
      return false;
    }
  }

  handleServerEvent(data) {
    switch (data.event) {
      case 'ready':
        this.log('Dịch vụ chuột Bluetooth đã sẵn sàng.', 'info');
        break;

      case 'adapter_ready':
        this.adapterInfo = data;
        this.log('Card Bluetooth máy tính hỗ trợ chế độ ngoại vi (Peripheral Role) thành công!', 'success');
        break;

      case 'status':
        if (data.status === 'starting') {
          this.setStatus('starting');
          if (data.message) this.log(data.message, 'info');
        }
        break;

      case 'adv_status':
        if (data.status === 'Started') {
          this.setStatus(this.connectedClients > 0 ? 'connected' : 'advertising');
          this.log('Chuột Bluetooth đang phát sóng (Advertising)...', 'info');
        }
        break;

      case 'started':
        this.setStatus(this.connectedClients > 0 ? 'connected' : 'advertising');
        this.log(data.message || 'Chuột Bluetooth đã bật!', 'success');
        break;

      case 'clients_changed':
        this.connectedClients = data.clientCount || 0;
        if (this.connectedClients > 0) {
          this.setStatus('connected');
          this.log(`📱 ${data.message || 'iPhone đã kết nối chuột Bluetooth!'}`, 'success');
        } else {
          this.setStatus(this.status !== 'stopped' ? 'advertising' : 'stopped');
          this.log(`📱 ${data.message || 'iPhone đã ngắt kết nối chuột.'}`, 'warn');
        }
        if (this.onClientsChange) {
          this.onClientsChange(this.connectedClients);
        }
        break;

      case 'stopped':
        this.setStatus('stopped');
        this.connectedClients = 0;
        this.log(data.message || 'Đã dừng chuột Bluetooth.', 'info');
        break;

      case 'airplay_window_entered':
        this.log(data.message || 'Con trỏ đã vào cửa sổ AirPlay Receiver -> Đang điều khiển iPhone', 'info');
        break;

      case 'error':
        this.log(`[BT Lỗi] ${data.error}`, 'error');
        break;
    }
  }

  sendCommand(obj) {
    if (!this.process || this.process.killed) {
      if (!this.ensureProcessRunning()) return;
    }
    try {
      this.process.stdin.write(JSON.stringify(obj) + '\n');
    } catch (e) {
      this.log(`Lỗi gửi lệnh chuột: ${e.message}`, 'error');
    }
  }

  start(deviceName = 'AirCast Mouse') {
    if (!this.ensureProcessRunning()) {
      return { success: false, error: 'Không thể khởi động tiến trình Bluetooth' };
    }
    this.setStatus('starting');
    this.sendCommand({ cmd: 'start', name: deviceName });
    return { success: true };
  }

  stop() {
    if (!this.process) {
      this.setStatus('stopped');
      return { success: true };
    }
    this.sendCommand({ cmd: 'stop' });
    return { success: true };
  }

  sendMouseMove(dx, dy) {
    if (this.status !== 'connected' && this.status !== 'advertising') return;
    this.sendCommand({ cmd: 'mouse_move', dx: Math.round(dx), dy: Math.round(dy) });
  }

  sendMouseDown(button = 'left') {
    if (this.status !== 'connected' && this.status !== 'advertising') return;
    this.sendCommand({ cmd: 'mouse_down', button });
  }

  sendMouseUp(button = 'left') {
    if (this.status !== 'connected' && this.status !== 'advertising') return;
    this.sendCommand({ cmd: 'mouse_up', button });
  }

  sendMouseWheel(delta = 0) {
    if (this.status !== 'connected' && this.status !== 'advertising') return;
    this.sendCommand({ cmd: 'mouse_wheel', delta: Math.round(delta) });
  }

  sendTap() {
    if (this.status !== 'connected' && this.status !== 'advertising') return;
    this.sendCommand({ cmd: 'tap' });
  }

  sendHome() {
    if (this.status !== 'connected' && this.status !== 'advertising') return;
    this.sendCommand({ cmd: 'home' });
  }

  sendSwipe(direction) {
    if (this.status !== 'connected' && this.status !== 'advertising') return;
    this.sendCommand({ cmd: `swipe_${direction}` });
  }

  setSensitivity(val) {
    this.sendCommand({ cmd: 'set_sensitivity', val: Number(val) });
  }

  syncCursor() {
    this.sendCommand({ cmd: 'sync_cursor' });
  }

  getStatus() {
    return {
      status: this.status,
      connectedClients: this.connectedClients,
      adapterInfo: this.adapterInfo
    };
  }

  terminate() {
    if (this.process) {
      try {
        this.sendCommand({ cmd: 'exit' });
        setTimeout(() => {
          if (this.process) {
            try { this.process.kill(); } catch (e) {}
            this.process = null;
          }
        }, 500);
      } catch (e) {}
    }
  }
}

module.exports = BluetoothMouseManager;
