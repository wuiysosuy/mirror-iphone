process.noAsar = true;

const builder = require('electron-builder');
const Platform = builder.Platform;

console.log(`Bắt đầu build AirCast Studio v${require('../package.json').version}...`);

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
    // Config will be automatically loaded from package.json
  }
})
.then((result) => {
  console.log('Build hoàn tất thành công!');
  console.log(result);
  process.exit(0);
})
.catch((error) => {
  console.error('Lỗi khi build:', error);
  process.exit(1);
});
