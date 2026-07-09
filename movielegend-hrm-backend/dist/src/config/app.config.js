"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    app: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        port: Number(process.env.PORT ?? 3001),
        corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:8081').split(','),
    },
});
//# sourceMappingURL=app.config.js.map