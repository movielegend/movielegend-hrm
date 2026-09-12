export default ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCsSPp2vj3uEo4wgp2wwkj051CLr04NeFE'
        }
      }
    }
  };
};
