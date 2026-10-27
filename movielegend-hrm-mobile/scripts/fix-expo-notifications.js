const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'TopicSubscriptionModule.android.js'
);

if (fs.existsSync(targetFile)) {
  const content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    const fixedContent = `import { requireOptionalNativeModule } from 'expo';

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default requireOptionalNativeModule('ExpoTopicSubscriptionModule') || fallbackModule;
`;
    fs.writeFileSync(targetFile, fixedContent, 'utf8');
    console.log('[fix-expo-notifications] Patched TopicSubscriptionModule.android.js successfully.');
  } else {
    console.log('[fix-expo-notifications] TopicSubscriptionModule.android.js already patched or updated.');
  }
}
