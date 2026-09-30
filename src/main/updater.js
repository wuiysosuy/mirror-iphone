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
const crypto = require('crypto');
const { execFile } = require('child_process');

// Luồng cập nhật "1 chạm":
//   1. Mở app -> tự kiểm tra GitHub Releases
//   2. Có bản mới -> tự tải nền bộ cài Setup (.exe) vào thư mục cache, kiểm tra SHA-256
//   3. Người dùng bấm "Cập nhật ngay" -> chạy bộ cài ở chế độ im lặng (/S --force-run),
//      Windows hỏi UAC 1 lần, bộ cài ghi đè đúng thư mục cũ rồi tự mở lại app.
class AppUpdater {
  constructor(mainWindow, options = {}) {
    this.mainWindow = mainWindow;
    this.owner = options.owner || 'wuiysosuy';
    this.repo = options.repo || 'mirror-iphone';
    this.currentVersion = (app && app.getVersion && app.getVersion()) || options.version || '1.0.0';
    this.activeDownloadRequest = null;
    this.activeDownload = null; // Promise tải đang chạy (tránh tải trùng)
    this.downloadedFilePath = null;
    this.latestInfo = null;
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  getCacheDir() {
    const base = app ? app.getPath('userData') : require('os').tmpdir();
    const dir = path.join(base, 'updates');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
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
          res.resume();
          const nextUrl = new URL(res.headers.location, url).href;
          return resolve(this.fetchJson(nextUrl, maxRedirects - 1));
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return reject(new Error(`HTTP status: ${res.statusCode}`));
        }

        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData));
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

  // Chọn đúng file bộ cài Setup trong danh sách assets (bỏ qua bản portable và .blockmap)
  pickInstallerAsset(assets) {
    if (!Array.isArray(assets)) return null;
    const exes = assets.filter(a => a && a.name && /\.exe$/i.test(a.name) && a.browser_download_url);
    return exes.find(a => /setup/i.test(a.name))
      || exes.find(a => !/portable/i.test(a.name))
      || null;
  }

  // Kiểm tra cập nhật
  async checkForUpdates() {
    const defaultGithubUrl = `https://github.com/${this.owner}/${this.repo}/releases/latest`;
    let updateData = null;

    // 1. GitHub Releases API chính thức
    try {
      const releaseApiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
      const release = await this.fetchJson(releaseApiUrl);

      if (release && release.tag_name) {
        const latestVer = release.tag_name.replace(/^[vV]/, '');
        const asset = this.pickInstallerAsset(release.assets);
        const digest = asset && typeof asset.digest === 'string' && asset.digest.startsWith('sha256:')
          ? asset.digest.slice(7).toLowerCase()
          : null;

        updateData = {
          latestVersion: latestVer,
          releaseName: release.name || `Phiên bản v${latestVer}`,
          releaseNotes: release.body || 'Bản cập nhật cải thiện hiệu năng và sửa lỗi.',
          publishedAt: release.published_at,
          downloadUrl: asset ? asset.browser_download_url : (release.html_url || defaultGithubUrl),
          size: asset ? asset.size : 0,
          sha256: digest,
          githubUrl: release.html_url || defaultGithubUrl
        };
      }
    } catch (e) {
      // API 404 (chưa có release) hoặc bị giới hạn lượt gọi -> dùng version.json
    }

    // 2. Fallback sang version.json trên nhánh main
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
            size: 0,
            sha256: null,
            githubUrl: jsonInfo.githubUrl || defaultGithubUrl
          };
        }
      } catch (err) {
        // Cả hai nguồn đều không khả dụng
      }
    }

    if (!updateData) {
      throw new Error('Không kết nối được máy chủ cập nhật GitHub. Vui lòng kiểm tra mạng Internet.');
    }

    const hasUpdate = this.compareVersions(updateData.latestVersion, this.currentVersion) > 0;
    const result = {
      success: true,
      hasUpdate,
      currentVersion: this.currentVersion,
      ...updateData,
      canAutoInstall: /\.exe$/i.test(new URL(updateData.downloadUrl).pathname),
      message: hasUpdate
        ? `Đã tìm thấy phiên bản mới v${updateData.latestVersion}!`
        : `Bạn đang ở phiên bản mới nhất (v${this.currentVersion}).`
    };

    if (hasUpdate) {
      this.latestInfo = result;
      const cached = this.getCachedInstaller(result);
      if (cached) {
        this.downloadedFilePath = cached;
        result.readyToInstall = true;
      }
    } else {
      this.cleanupCache();
    }

    return result;
  }

  getInstallerPath(version) {
    return path.join(this.getCacheDir(), `AirCast-Studio-Setup-${version}.exe`);
  }

  // Trả về đường dẫn bộ cài đã tải trước đó nếu còn nguyên vẹn
  getCachedInstaller(info) {
    const filePath = this.getInstallerPath(info.latestVersion);
    try {
      const stat = fs.statSync(filePath);
      if (stat.size === 0) return null;
      if (info.size && stat.size !== info.size) return null;
      return filePath;
    } catch (e) {
      return null;
    }
  }

  // Xóa các bộ cài cũ trong cache (giữ lại bản đang dùng nếu có)
  cleanupCache(keepPath) {
    try {
      const dir = this.getCacheDir();
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (full !== keepPath) {
          try { fs.unlinkSync(full); } catch (e) {}
        }
      }
    } catch (e) {}
  }

  sha256File(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      fs.createReadStream(filePath)
        .on('data', (d) => hash.update(d))
        .on('end', () => resolve(hash.digest('hex')))
        .on('error', reject);
    });
  }

  // Tải bộ cài về cache. Có thể gọi nhiều lần — lần sau dùng lại lượt tải đang chạy / file đã tải.
  downloadUpdate(downloadUrl, version) {
    const info = this.latestInfo && (!version || this.latestInfo.latestVersion === version)
      ? this.latestInfo
      : { latestVersion: version || 'new', downloadUrl, size: 0, sha256: null };
    const url = downloadUrl || info.downloadUrl;

    if (!url || !/^https?:/i.test(url)) {
      return Promise.reject(new Error('Đường dẫn tải xuống không hợp lệ.'));
    }

    // Link không phải file .exe (trang release) -> mở trình duyệt
    if (!/\.exe$/i.test(new URL(url).pathname)) {
      if (shell) shell.openExternal(info.githubUrl || url);
      return Promise.resolve({ success: false, openedInBrowser: true, message: 'Đã mở trang tải về trên trình duyệt.' });
    }

    const cached = this.getCachedInstaller(info);
    if (cached) {
      this.downloadedFilePath = cached;
      this.notifyProgress({ percent: 100, receivedBytes: info.size || 0, totalBytes: info.size || 0, speedBytesPerSec: 0 });
      return Promise.resolve({ success: true, filePath: cached, message: 'Bản cập nhật đã sẵn sàng.' });
    }

    if (this.activeDownload) return this.activeDownload;

    const savePath = this.getInstallerPath(info.latestVersion);
    const partPath = savePath + '.part';
    this.cleanupCache();

    this.activeDownload = new Promise((resolve, reject) => {
      const fail = (err) => {
        this.activeDownloadRequest = null;
        fs.unlink(partPath, () => {});
        reject(err);
      };

      const downloadWithRedirect = (targetUrl, maxRedirects = 6) => {
        if (maxRedirects <= 0) {
          return fail(new Error('Quá nhiều chuyển hướng khi tải file.'));
        }

        const client = targetUrl.startsWith('https:') ? https : http;
        const req = client.get(targetUrl, {
          headers: { 'User-Agent': `AirCast-Studio/${this.currentVersion} (Windows)` }
        }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return downloadWithRedirect(new URL(res.headers.location, targetUrl).href, maxRedirects - 1);
          }

          if (res.statusCode !== 200) {
            res.resume();
            return fail(new Error(`Tải file thất bại với mã lỗi HTTP: ${res.statusCode}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10) || info.size || 0;
          let receivedBytes = 0;
          let lastTime = Date.now();
          let bytesSinceLastTime = 0;

          const fileStream = fs.createWriteStream(partPath);

          res.on('data', (chunk) => {
            receivedBytes += chunk.length;
            bytesSinceLastTime += chunk.length;

            const now = Date.now();
            if (now - lastTime >= 400) {
              const speed = (bytesSinceLastTime / (now - lastTime)) * 1000;
              lastTime = now;
              bytesSinceLastTime = 0;
              this.notifyProgress({
                percent: totalBytes > 0 ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100)) : 0,
                receivedBytes,
                totalBytes,
                speedBytesPerSec: Math.round(speed)
              });
            }
          });

          res.on('aborted', () => fail(new Error('Kết nối bị ngắt khi đang tải.')));
          fileStream.on('error', fail);

          fileStream.on('finish', async () => {
            try {
              if (totalBytes && receivedBytes !== totalBytes) {
                return fail(new Error('File tải về không đầy đủ, vui lòng thử lại.'));
              }
              if (info.sha256) {
                const actual = await this.sha256File(partPath);
                if (actual !== info.sha256) {
                  return fail(new Error('File tải về bị lỗi (sai mã kiểm tra SHA-256), vui lòng thử lại.'));
                }
              }
              fs.renameSync(partPath, savePath);
              this.activeDownloadRequest = null;
              this.downloadedFilePath = savePath;
              this.notifyProgress({ percent: 100, receivedBytes, totalBytes: totalBytes || receivedBytes, speedBytesPerSec: 0 });
              resolve({ success: true, filePath: savePath, message: 'Tải xuống bản cập nhật thành công!' });
            } catch (err) {
              fail(err);
            }
          });

          res.pipe(fileStream);
        });

        req.on('error', fail);
        req.setTimeout(30000, () => req.destroy(new Error('Mạng quá chậm hoặc mất kết nối khi tải bản cập nhật.')));
        this.activeDownloadRequest = req;
      };

      downloadWithRedirect(url);
    }).finally(() => {
      this.activeDownload = null;
    });

    return this.activeDownload;
  }

  cancelDownload() {
    if (this.activeDownloadRequest) {
      try {
        this.activeDownloadRequest.destroy(new Error('Đã hủy tải bản cập nhật.'));
      } catch (e) {}
      this.activeDownloadRequest = null;
    }
    return { success: true };
  }

  notifyProgress(progress) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater:download-progress', progress);
    }
  }

  // Chạy bộ cài NSIS ở chế độ im lặng rồi thoát app.
  //   --updated   : báo cho bộ cài biết đây là bản nâng cấp (giữ nguyên shortcut, thư mục cài)
  //   /S          : cài im lặng, không hiện wizard
  //   --force-run : cài xong tự mở lại AirCast Studio
  // Start-Process -Verb RunAs dùng ShellExecute nên Windows tự hiện hộp UAC (bộ cài perMachine cần quyền Admin).
  runInstallerElevated(filePath) {
    const psPath = filePath.replace(/'/g, "''");
    // 1223 = ERROR_CANCELLED: người dùng bấm "No" ở hộp UAC
    const command = '$ErrorActionPreference = "Stop"; '
      + `try { Start-Process -FilePath '${psPath}' -ArgumentList '--updated','/S','--force-run' -Verb RunAs; exit 0 } `
      + 'catch { $e = $_.Exception; while ($e) { if ($e.NativeErrorCode -eq 1223) { exit 1223 }; $e = $e.InnerException }; [Console]::Error.WriteLine($_.Exception.Message); exit 1 }';

    return new Promise((resolve) => {
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command],
        { windowsHide: true },
        (err, _stdout, stderr) => {
          if (!err) return resolve({ ok: true });
          resolve({ ok: false, cancelled: err.code === 1223, error: (stderr || err.message || '').trim() });
        });
    });
  }

  async installUpdate(filePath) {
    const targetFile = filePath || this.downloadedFilePath;
    if (!targetFile || !fs.existsSync(targetFile)) {
      return { success: false, error: 'Không tìm thấy file cài đặt cập nhật. Vui lòng tải lại.' };
    }

    const result = await this.runInstallerElevated(targetFile);
    if (!result.ok) {
      if (result.cancelled) {
        return { success: false, cancelled: true, error: 'Bạn đã từ chối cấp quyền Admin. Bấm "Cập nhật ngay" để thử lại.' };
      }
      return { success: false, error: 'Không khởi chạy được bộ cài: ' + result.error };
    }

    // Bộ cài đã chạy ngầm -> thoát app ngay để nó ghi đè file.
    // before-quit trong index.js sẽ dừng AirPlayServer / Mouse server.
    setTimeout(() => {
      if (app && app.quit) app.quit();
      else process.exit(0);
    }, 300);

    return { success: true, message: 'Đang cài đặt bản mới, ứng dụng sẽ tự mở lại sau ít giây...' };
  }
}

module.exports = AppUpdater;
