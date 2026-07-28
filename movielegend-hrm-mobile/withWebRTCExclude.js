const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withWebRTCExclude(config) {
  return withAppBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      const excludeConfig = `
configurations.all {
    exclude group: 'org.jitsi', module: 'webrtc'
}
`;
      if (!buildGradle.includes("exclude group: 'org.jitsi'")) {
        config.modResults.contents = buildGradle + excludeConfig;
      }
    }
    return config;
  });
};
