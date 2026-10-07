const { withGradleProperties } = require('@expo/config-plugins');

function withDisableNewArch(config) {
  return withGradleProperties(config, (cfg) => {
    let hasEdgeToEdge = false;
    cfg.modResults = cfg.modResults.map((item) => {
      if (item.type === 'property' && item.key === 'newArchEnabled') {
        return { ...item, value: 'false' };
      }
      if (item.type === 'property' && item.key === 'edgeToEdgeEnabled') {
        hasEdgeToEdge = true;
        return { ...item, value: 'false' };
      }
      return item;
    });
    if (!hasEdgeToEdge) {
      cfg.modResults.push({ type: 'property', key: 'edgeToEdgeEnabled', value: 'false' });
    }
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
