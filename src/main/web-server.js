const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

class MobileWebServer {
  constructor(port = 5050) {
    this.port = port;
    this.httpServer = null;
    this.wss = null;
    this.activeSockets = new Set();
    this.onPhoneConnected = null;
    this.onPhoneDisconnected = null;
    this.onFrameReceived = null;
    this.onPhotoReceived = null;
  }

  async generateQrCode(url) {
    try {
      return await QRCode.toDataURL(url, {
        margin: 1,
        width: 260,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Lỗi tạo mã QR:', err);
      return null;
    }
  }

  start(localIp) {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => {
        let filePath = path.join(__dirname, '../mobile', req.url === '/' ? 'index.html' : req.url);

        // Security check
        if (!filePath.startsWith(path.join(__dirname, '../mobile'))) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
          }

          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
          };

          res.writeHead(200, {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(data);
        });
      });

      this.httpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          this.port += 1;
          this.httpServer.listen(this.port);
        } else {
          reject(err);
        }
      });

      this.httpServer.listen(this.port, async () => {
        const portalUrl = `http://${localIp}:${this.port}`;
        const qrDataUrl = await this.generateQrCode(portalUrl);

        // Khởi tạo WebSocket Server
        this.wss = new WebSocketServer({ server: this.httpServer });

        this.wss.on('connection', (ws, req) => {
          this.activeSockets.add(ws);
          const userAgent = req.headers['user-agent'] || 'Thiết bị';

          if (this.onPhoneConnected) {
            this.onPhoneConnected({ userAgent, ip: req.socket.remoteAddress });
          }

          ws.on('message', (message) => {
            try {
              if (typeof message === 'string' || message instanceof String) {
                const data = JSON.parse(message);
                if (data.type === 'camera_frame' && this.onFrameReceived) {
                  this.onFrameReceived(data.image);
                } else if (data.type === 'photo_cast' && this.onPhotoReceived) {
                  this.onPhotoReceived(data.image);
                }
              } else {
                // Binary frame buffer
                if (this.onFrameReceived) {
                  this.onFrameReceived(message);
                }
              }
            } catch (e) {
              console.error('WS Error:', e);
            }
          });

          ws.on('close', () => {
            this.activeSockets.delete(ws);
            if (this.onPhoneDisconnected) {
              this.onPhoneDisconnected();
            }
          });
        });

        resolve({
          port: this.port,
          url: portalUrl,
          qrCode: qrDataUrl
        });
      });
    });
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
  }
}

module.exports = MobileWebServer;
