"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    storage: {
        driver: process.env.STORAGE_DRIVER ?? 'local',
        localRoot: process.env.STORAGE_LOCAL_ROOT ?? 'storage',
    },
});
//# sourceMappingURL=storage.config.js.map