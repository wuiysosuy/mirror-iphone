const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ServerManager {
  constructor(appPath) {
    this.appPath = appPath;
    this.binDir = path.join(appPath, 'bin');
    this.exePath = path.join(this.binDir, 'AirPlayServer.exe');
    this.process = null;
    this.status = 'stopped'; // 'stopped' | 'starting' | 'running' | 'error'
    this.logs = [];
    this.onStatusChange = null;
    this.onLog = null;
  }

  log(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, message: msg, type };
    this.logs.push(entry);
    if (this.logs.length > 200) {
      this.logs.shift();
    }
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

  start(options = {}) {
    if (this.process && !this.process.killed) {
      this.log('Máy chủ AirPlay đang chạy rồi.', 'warn');
      return { success: true, message: 'Đang chạy' };
    }

    if (!fs.existsSync(this.exePath)) {
      const err = `Không tìm thấy file thực thi AirPlayServer.exe tại: ${this.exePath}`;
      this.log(err, 'error');
      this.setStatus('error');
      return { success: false, error: err };
    }

    this.setStatus('starting');
    this.log('Đang khởi động dịch vụ AirPlay Receiver...', 'info');

    const args = [];
    if (options.debug) {
      args.push('--debug');
    }

    try {
      this.process = spawn(this.exePath, args, {
        cwd: this.binDir,
        windowsHide: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.process.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
          this.log(text, 'info');
        }
      });

      this.process.stderr.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
          this.log(text, 'warn');
        }
      });

      this.process.on('error', (err) => {
        this.log(`Lỗi tiến trình AirPlay: ${err.message}`, 'error');
        this.setStatus('error');
      });

      this.process.on('close', (code) => {
        this.log(`Máy chủ AirPlay đã dừng (Exit code: ${code})`, code === 0 ? 'info' : 'warn');
        this.process = null;
        this.setStatus('stopped');
      });

      // Cho 1 giây để kiểm tra xem process có bị crash ngay không
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.setStatus('running');
          this.log('Máy chủ AirPlay đã sẵn sàng nhận kết nối từ iPhone!', 'success');
        }
      }, 1000);

      return { success: true };
    } catch (error) {
      this.log(`Không thể khởi chạy: ${error.message}`, 'error');
      this.setStatus('error');
      return { success: false, error: error.message };
    }
  }

  stop() {
    if (!this.process) {
      this.setStatus('stopped');
      return { success: true };
    }

    this.log('Đang dừng máy chủ AirPlay...', 'info');
    try {
      this.process.kill('SIGTERM');
      // Nếu sau 2 giây chưa tắt thì kill mạnh
      setTimeout(() => {
        if (this.process) {
          try {
            this.process.kill('SIGKILL');
          } catch (e) {}
        }
      }, 2000);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  restart(options) {
    this.stop();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.start(options));
      }, 1500);
    });
  }

  getStatus() {
    return {
      status: this.status,
      isRunning: this.status === 'running' || this.status === 'starting',
      pid: this.process ? this.process.pid : null,
      logs: this.logs
    };
  }
}

module.exports = ServerManager;
