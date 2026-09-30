const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

class BluetoothMouseManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.binDir = path.join(baseDir, 'bin');
    this.exePath = path.join(this.binDir, 'AirCastMouseServer.exe');
    this.process = null;
    this.status = 'stopped'; // 'stopped' | 'starting' | 'advertising' | 'connected' | 'error' | 'unsupported'
    this.connectedClients = 0;
    this.adapterInfo = null;
    this.compatibilityInfo = null;
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

  setStatus(newStatus, extra = null) {
    this.status = newStatus;
    if (this.onStatusChange) {
      this.onStatusChange(newStatus, extra);
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
        } else if (data.status === 'Aborted') {
          this.setStatus('unsupported');
          this.log('❌ Phát sóng Bluetooth bị Windows hủy (Aborted). Card Bluetooth của máy không hỗ trợ phát sóng ngoại vi (BLE Peripheral Advertising).', 'error');
          if (this.onStatusChange) {
            this.onStatusChange('unsupported', 'Card Bluetooth trên máy không hỗ trợ phát sóng BLE (Lỗi Aborted).');
          }
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

  formatCompatibilityData(hw) {
    const checks = [
      {
        title: 'Dịch vụ Bluetooth Windows (bthserv)',
        passed: !!hw.hasBluetoothService,
        note: hw.hasBluetoothService ? 'Đang chạy' : 'Chưa bật (vào services.msc để bật)'
      },
      {
        title: `Phần cứng: ${hw.adapterName || 'Bluetooth Adapter'}`,
        passed: !!hw.hasAdapter,
        note: hw.hasAdapter ? 'Đã nhận diện phần cứng' : 'Không tìm thấy thiết bị'
      },
      {
        title: 'Trạng thái sóng Bluetooth',
        passed: hw.radioState === 'On',
        note: hw.radioState === 'On' ? 'Đang Bật (On)' : 'Đang Tắt (Cần gạt BẬT trong Settings)'
      },
      {
        title: 'Hỗ trợ Bluetooth Low Energy (BLE)',
        passed: !!hw.isLowEnergySupported,
        note: hw.isLowEnergySupported ? 'Có hỗ trợ' : 'Không hỗ trợ BLE'
      },
      {
        title: 'Chế độ thiết bị ngoại vi (BLE Peripheral Role)',
        passed: !!hw.isPeripheralRoleSupported,
        note: hw.isPeripheralRoleSupported ? 'Driver có hỗ trợ' : 'Driver không hỗ trợ'
      },
      {
        title: 'Khả năng phát sóng chuột thực tế (GATT HID)',
        passed: !!hw.canBroadcastBle,
        note: hw.canBroadcastBle ? 'Phát sóng thành công' : 'Bị Windows chặn (Lỗi Aborted)'
      }
    ];

    const recommendations = [];
    let reason = '';

    if (!hw.hasBluetoothService) {
      recommendations.push('Bật dịch vụ "Bluetooth Support Service" trong Windows Services (services.msc).');
    }
    if (!hw.hasAdapter) {
      recommendations.push('Máy tính chưa có card Bluetooth. Cần cắm USB Bluetooth Dongle 5.0/5.3 vào máy tính.');
    }
    if (hw.radioState !== 'On') {
      recommendations.push('Mở Cài đặt Windows (Settings > Bluetooth & devices) và gạt BẬT Bluetooth.');
    }
    if (!hw.canBroadcastBle || !hw.isPeripheralRoleSupported) {
      reason = 'Card Bluetooth tích hợp bị Windows chặn phát sóng ngoại vi (Lỗi Aborted). Vì vậy iPhone không thể dò thấy tín hiệu chuột Bluetooth.';
      recommendations.push('Cắm thêm USB Bluetooth Dongle 5.0/5.3 chuyên dụng (như TP-Link UB500, Baseus BA04, Orico) để máy tính phát sóng chuột chuẩn BLE HID.');
      recommendations.push('Cập nhật driver card Bluetooth mới nhất từ trang chủ nhà sản xuất (Realtek/Intel).');
    }

    if (hw.isCompatible) {
      reason = 'Phần cứng Bluetooth của máy tính đạt chuẩn 100%, sẵn sàng phát chuột không dây cho iPhone.';
    } else if (!reason) {
      reason = 'Phần cứng Bluetooth của máy tính chưa đáp ứng đủ điều kiện phát sóng chuột.';
    }

    return {
      ...hw,
      isCompatible: !!hw.isCompatible,
      reason,
      checks,
      recommendations
    };
  }

  async checkCompatibility() {
    const scriptPath = path.join(this.baseDir, 'scripts', 'check_bt.ps1');
    return new Promise((resolve) => {
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, { encoding: 'utf8' }, (error, stdout) => {
        try {
          if (stdout && stdout.trim()) {
            const hw = JSON.parse(stdout.trim());
            const data = this.formatCompatibilityData(hw);
            this.compatibilityInfo = data;
            if (!data.isCompatible) {
              this.status = 'unsupported';
              this.setStatus('unsupported', data);
            }
            resolve(data);
            return;
          }
        } catch (e) {
          this.log(`Lỗi phân tích JSON kiểm tra phần cứng BT: ${e.message}`, 'warn');
        }
        const fallback = this.formatCompatibilityData({
          hasBluetoothService: false,
          hasAdapter: false,
          radioState: 'Off',
          isCompatible: false
        });
        this.compatibilityInfo = fallback;
        this.status = 'unsupported';
        this.setStatus('unsupported', fallback);
        resolve(fallback);
      });
    });
  }

  getStatus() {
    return {
      status: this.status,
      connectedClients: this.connectedClients,
      adapterInfo: this.adapterInfo,
      compatibilityInfo: this.compatibilityInfo
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
