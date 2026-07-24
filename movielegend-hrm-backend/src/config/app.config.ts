export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3001),
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:8081').split(','),
    httpSmsApiKey: process.env.HTTPSMS_API_KEY ?? '',
    httpSmsFromPhone: process.env.HTTPSMS_FROM_PHONE ?? '',
  },
});
