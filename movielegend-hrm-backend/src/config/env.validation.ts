export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const required = ['DATABASE_URL'];
  if (nodeEnv === 'production') required.push('JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGINS');
  for (const key of required) {
    if (!config[key]) throw new Error(`Missing required environment variable: ${key}`);
  }
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = String(config[key] ?? '');
    if (nodeEnv === 'production' && /^(secret123|default-secret|changeme)$/i.test(value)) {
      throw new Error(`Insecure production secret: ${key}`);
    }
  }
  const cors = String(config.CORS_ORIGINS ?? '');
  if (nodeEnv === 'production' && cors.split(',').map((item) => item.trim()).includes('*')) {
    throw new Error('CORS_ORIGINS cannot include * in production');
  }
  return config;
}
