const os = require('os');
const { exec } = require('child_process');

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  let primaryIp = '127.0.0.1';
  let primaryInterface = 'Không xác định';

  for (const [name, netList] of Object.entries(interfaces)) {
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
          mac: net.mac,
          netmask: net.netmask
        });

        const lowerName = name.toLowerCase();
        if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
          primaryIp = net.address;
          primaryInterface = name;
        } else if (primaryIp === '127.0.0.1' && (lowerName.includes('ethernet') || lowerName.includes('lan'))) {
          primaryIp = net.address;
          primaryInterface = name;
        }
      }
    }
  }

  if (primaryIp === '127.0.0.1' && addresses.length > 0) {
    primaryIp = addresses[0].ip;
    primaryInterface = addresses[0].interface;
  }

  return {
    hostname: os.hostname(),
    primaryIp,
    primaryInterface,
    allInterfaces: addresses
  };
}

function checkFirewallStatus() {
  return new Promise((resolve) => {
    exec('netsh advfirewall firewall show rule name="AirCast Studio - AirPlay Ports"', (error, stdout) => {
      if (error || !stdout || stdout.includes('No rules match') || stdout.includes('Không tìm thấy')) {
        resolve({ configured: false, message: 'Chưa cấu hình quy tắc tường lửa tự động' });
      } else {
        resolve({ configured: true, message: 'Đã mở quy tắc tường lửa cho AirCast Studio' });
      }
    });
  });
}

function checkBonjourStatus() {
  return new Promise((resolve) => {
    exec('sc query "Bonjour Service"', (error, stdout) => {
      if (!error && stdout && stdout.includes('RUNNING')) {
        resolve({ installed: true, running: true, message: 'Dịch vụ Apple Bonjour đang hoạt động' });
      } else if (!error && stdout && stdout.includes('STOPPED')) {
        resolve({ installed: true, running: false, message: 'Dịch vụ Apple Bonjour đã cài nhưng đang dừng' });
      } else {
        resolve({ installed: false, running: false, message: 'Chưa cài đặt Apple Bonjour trên máy tính' });
      }
    });
  });
}

module.exports = {
  getNetworkInfo,
  checkFirewallStatus,
  checkBonjourStatus
};
