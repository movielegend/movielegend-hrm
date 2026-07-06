export default () => ({
  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    localRoot: process.env.STORAGE_LOCAL_ROOT ?? 'storage',
  },
});
