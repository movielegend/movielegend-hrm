const { withGradleProperties } = require('@expo/config-plugins');

function withDisableNewArch(config) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.map((item) => {
      if (item.type === 'property' && item.key === 'newArchEnabled') {
        return { ...item, value: 'false' };
      }
      return item;
    });
    return cfg;
  });
}

module.exports = ({ config }) => {
  const customConfig = {
    ...config,
    newArchEnabled: false,
    android: {
      ...config.android,
      newArchEnabled: false,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCsSPp2vj3uEo4wgp2wwkj051CLr04NeFE'
        }
      }
    }
  };

  return withDisableNewArch(customConfig);
};
