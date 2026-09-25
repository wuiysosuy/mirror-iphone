let electron = null;
try {
  electron = require('electron');
} catch (e) {}

const app = electron ? electron.app : null;
const shell = electron ? electron.shell : null;
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AppUpdater {
  constructor(mainWindow, options = {}) {
    this.mainWindow = mainWindow;
    this.owner = options.owner || 'wuiysosuy';
    this.repo = options.repo || 'mirror-iphone';
    this.currentVersion = (app && app.getVersion && app.getVersion()) || options.version || '1.0.0';
    this.activeDownloadRequest = null;
    this.downloadedFilePath = null;
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  // So sánh 2 phiên bản SemVer (trả về 1 nếu v1 > v2, -1 nếu v1 < v2, 0 nếu bằng nhau)
  compareVersions(v1, v2) {
    const clean1 = (v1 || '').replace(/^[vV]/, '').split('-')[0];
    const clean2 = (v2 || '').replace(/^[vV]/, '').split('-')[0];

    const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

    const len = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < len; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  // Fetch JSON từ URL hỗ trợ redirect
  fetchJson(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
      if (maxRedirects <= 0) {
        return reject(new Error('Quá nhiều lần chuyển hướng mạng.'));
      }

      const client = url.startsWith('https:') ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': `AirCast-Studio/${this.currentVersion} (Windows)`,
          'Accept': 'application/json'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          return resolve(this.fetchJson(nextUrl, maxRedirects - 1));
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP status: ${res.statusCode}`));
        }

        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Lỗi giải mã JSON từ máy chủ cập nhật: ' + e.message));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(12000, () => {
        req.destroy();
        reject(new Error('Kết nối kiểm tra cập nhật quá thời gian chờ (Timeout).'));
      });
    });
  }

  // Kiểm tra cập nhật
  async checkForUpdates() {
    const defaultGithubUrl = `https://github.com/${this.owner}/${this.repo}/releases/latest`;
    let updateData = null;

    // 1. Thử lấy từ GitHub Releases API chính thức
    try {
      const releaseApiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
      const release = await this.fetchJson(releaseApiUrl);

      if (release && release.tag_name) {
        const latestVer = release.tag_name.replace(/^[vV]/, '');
        let downloadUrl = release.html_url || defaultGithubUrl;

        // Tìm file .exe trong danh sách assets
        if (Array.isArray(release.assets) && release.assets.length > 0) {
          const exeAsset = release.assets.find(a => a.name.toLowerCase().endsWith('.exe'));
          if (exeAsset && exeAsset.browser_download_url) {
            downloadUrl = exeAsset.browser_download_url;
          }
        }

        updateData = {
          latestVersion: latestVer,
          releaseName: release.name || `Phiên bản v${latestVer}`,
          releaseNotes: release.body || 'Bản cập nhật cải thiện hiệu năng và sửa lỗi.',
          publishedAt: release.published_at,
          downloadUrl: downloadUrl,
          githubUrl: release.html_url || defaultGithubUrl
        };
      }
    } catch (e) {
      // Nếu API 404 (chưa có release) hoặc rate limit, thử fallback qua file version.json trên nhánh main
    }

    // 2. Fallback sang version.json từ raw.githubusercontent.com
    if (!updateData) {
      try {
        const rawJsonUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/version.json`;
        const jsonInfo = await this.fetchJson(rawJsonUrl);

        if (jsonInfo && jsonInfo.version) {
          updateData = {
            latestVersion: jsonInfo.version.replace(/^[vV]/, ''),
            releaseName: jsonInfo.releaseName || `Phiên bản v${jsonInfo.version}`,
            releaseNotes: jsonInfo.releaseNotes || 'Có bản cập nhật mới.',
            publishedAt: jsonInfo.releaseDate || new Date().toISOString(),
            downloadUrl: jsonInfo.downloadUrl || defaultGithubUrl,
            githubUrl: jsonInfo.githubUrl || defaultGithubUrl
          };
        }
      } catch (err) {
        // Cả hai nguồn đều không khả dụng
      }
    }

    if (!updateData) {
      return {
        success: true,
        hasUpdate: false,
        currentVersion: this.currentVersion,
        message: 'Bạn đang sử dụng phiên bản mới nhất.'
      };
    }

    const hasUpdate = this.compareVersions(updateData.latestVersion, this.currentVersion) > 0;

    return {
      success: true,
      hasUpdate: hasUpdate,
      currentVersion: this.currentVersion,
      latestVersion: updateData.latestVersion,
      releaseName: updateData.releaseName,
      releaseNotes: updateData.releaseNotes,
      publishedAt: updateData.publishedAt,
      downloadUrl: updateData.downloadUrl,
      githubUrl: updateData.githubUrl,
      message: hasUpdate
        ? `Đã tìm thấy phiên bản mới v${updateData.latestVersion}!`
        : `Bạn đang ở phiên bản mới nhất (v${this.currentVersion}).`
    };
  }

  // Tải file cài đặt về máy
  downloadUpdate(downloadUrl, version) {
    return new Promise((resolve, reject) => {
      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        return reject(new Error('Đường dẫn tải xuống không hợp lệ.'));
      }

      // Nếu link dẫn tới trang web (không phải file trực tiếp), mở trình duyệt
      if (!downloadUrl.toLowerCase().endsWith('.exe')) {
        shell.openExternal(downloadUrl);
        return resolve({ openedInBrowser: true, message: 'Đã mở trang tải về trên trình duyệt.' });
      }

      const tempDir = app.getPath('temp');
      const fileName = `AirCast-Studio-Update-v${version || 'new'}.exe`;
      const savePath = path.join(tempDir, fileName);
      this.downloadedFilePath = savePath;

      const fileStream = fs.createWriteStream(savePath);

      const downloadWithRedirect = (targetUrl, maxRedirects = 6) => {
        if (maxRedirects <= 0) {
          fileStream.close();
          fs.unlink(savePath, () => {});
          return reject(new Error('Quá nhiều chuyển hướng khi tải file.'));
        }

        const client = targetUrl.startsWith('https:') ? https : http;
        const req = client.get(targetUrl, {
          headers: {
            'User-Agent': `AirCast-Studio/${this.currentVersion} (Windows)`
          }
        }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const nextUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, targetUrl).href;
            return downloadWithRedirect(nextUrl, maxRedirects - 1);
          }

          if (res.statusCode !== 200) {
            fileStream.close();
            fs.unlink(savePath, () => {});
            return reject(new Error(`Tải file thất bại với mã lỗi HTTP: ${res.statusCode}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let receivedBytes = 0;
          let lastTime = Date.now();
          let bytesSinceLastTime = 0;
          let currentSpeed = 0; // bytes/sec

          res.on('data', (chunk) => {
            receivedBytes += chunk.length;
            bytesSinceLastTime += chunk.length;

            const now = Date.now();
            if (now - lastTime >= 400) {
              currentSpeed = (bytesSinceLastTime / (now - lastTime)) * 1000;
              lastTime = now;
              bytesSinceLastTime = 0;

              const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0;
              this.notifyProgress({
                percent,
                receivedBytes,
                totalBytes,
                speedBytesPerSec: Math.round(currentSpeed)
              });
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => {
              this.notifyProgress({
                percent: 100,
                receivedBytes,
                totalBytes: totalBytes || receivedBytes,
                speedBytesPerSec: 0
              });
              resolve({
                success: true,
                filePath: savePath,
                message: 'Tải xuống bản cập nhật thành công!'
              });
            });
          });
        });

        req.on('error', (err) => {
          fileStream.close();
          fs.unlink(savePath, () => {});
          reject(err);
        });

        this.activeDownloadRequest = req;
      };

      downloadWithRedirect(downloadUrl);
    });
  }

  cancelDownload() {
    if (this.activeDownloadRequest) {
      try {
        this.activeDownloadRequest.destroy();
        this.activeDownloadRequest = null;
      } catch (e) {}
    }
    if (this.downloadedFilePath && fs.existsSync(this.downloadedFilePath)) {
      try {
        fs.unlinkSync(this.downloadedFilePath);
      } catch (e) {}
    }
    return { success: true };
  }

  notifyProgress(progress) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater:download-progress', progress);
    }
  }

  // Thực thi cài đặt file update và thoát ứng dụng cũ
  installUpdate(filePath) {
    const targetFile = filePath || this.downloadedFilePath;
    if (!targetFile || !fs.existsSync(targetFile)) {
      return { success: false, error: 'Không tìm thấy file cài đặt cập nhật.' };
    }

    try {
      // Khởi chạy file installer độc lập trong tiến trình riêng của Windows
      const installerProcess = spawn(targetFile, [], {
        detached: true,
        stdio: 'ignore'
      });
      installerProcess.unref();

      // Thoát ứng dụng hiện tại sau 800ms để trình cài đặt chạy nâng cấp
      setTimeout(() => {
        app.quit();
      }, 800);

      return { success: true, message: 'Đang khởi chạy trình cập nhật...' };
    } catch (err) {
      // Fallback mở file qua Windows Explorer
      shell.openPath(targetFile);
      return { success: true, message: 'Đã mở file cài đặt qua Windows Explorer.' };
    }
  }
}

module.exports = AppUpdater;
