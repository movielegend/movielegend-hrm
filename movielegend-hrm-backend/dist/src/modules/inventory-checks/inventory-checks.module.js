"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryChecksModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const realtime_module_1 = require("../realtime/realtime.module");
const stock_module_1 = require("../stock/stock.module");
const warehouse_module_1 = require("../warehouse/warehouse.module");
const inventory_checks_controller_1 = require("./inventory-checks.controller");
const inventory_checks_service_1 = require("./inventory-checks.service");
let InventoryChecksModule = class InventoryChecksModule {
};
exports.InventoryChecksModule = InventoryChecksModule;
exports.InventoryChecksModule = InventoryChecksModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, warehouse_module_1.WarehouseModule, stock_module_1.StockModule, realtime_module_1.RealtimeModule],
        controllers: [inventory_checks_controller_1.InventoryChecksController],
        providers: [inventory_checks_service_1.InventoryChecksService],
    })
], InventoryChecksModule);
//# sourceMappingURL=inventory-checks.module.js.map