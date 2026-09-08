const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'node_modules', 'react-native-image-viewing', 'dist', 'components', 'ImageItem');
const iosFile = path.join(targetDir, 'ImageItem.ios.js');
const jsFile = path.join(targetDir, 'ImageItem.js');
const webFile = path.join(targetDir, 'ImageItem.web.js');

if (fs.existsSync(iosFile)) {
  if (!fs.existsSync(jsFile)) {
    fs.copyFileSync(iosFile, jsFile);
  }
  if (!fs.existsSync(webFile)) {
    fs.copyFileSync(iosFile, webFile);
  }
}
