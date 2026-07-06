export default () => ({
  notification: {
    socketEnabled: process.env.SOCKET_ENABLED !== 'false',
  },
});
