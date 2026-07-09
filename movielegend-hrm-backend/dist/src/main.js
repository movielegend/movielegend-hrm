"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableShutdownHooks();
    if (process.env.NODE_ENV === 'production') {
        app.use((0, helmet_1.default)());
    }
    else {
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: false,
            crossOriginOpenerPolicy: false,
        }));
    }
    const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:8081')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });
    app.setGlobalPrefix('api/v1', {
        exclude: ['health', 'health/live', 'health/ready'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('MovieLegend HRM API')
        .setDescription('MovieLegend HRM backend API')
        .setVersion('1.0')
        .addTag('Health')
        .addTag('Auth')
        .addTag('Users')
        .addTag('Employees')
        .addTag('Departments')
        .addTag('Positions')
        .addTag('Uploads')
        .addTag('Roles')
        .addTag('Permissions')
        .addTag('Approvals')
        .addTag('Face')
        .addTag('Shifts')
        .addTag('Shift Assignments')
        .addTag('Attendance')
        .addTag('Leave')
        .addTag('Employee Requests')
        .addTag('Tasks')
        .addTag('Task Groups')
        .addTag('Task Assignments')
        .addTag('Task Extensions')
        .addTag('Cross Department')
        .addTag('Notifications')
        .addTag('Device Tokens')
        .addTag('Warehouses')
        .addTag('Materials')
        .addTag('Stock Receipts')
        .addTag('Material Issues')
        .addTag('Stock Transfers')
        .addTag('Assets')
        .addTag('Asset Assignments')
        .addTag('Asset Incidents')
        .addTag('Asset Maintenance')
        .addTag('Inventory Checks')
        .addTag('Salary Profiles')
        .addTag('Salary Components')
        .addTag('Payroll Periods')
        .addTag('Payrolls')
        .addTag('Bonuses')
        .addTag('Deductions')
        .addTag('Violations')
        .addTag('Disciplinary Actions')
        .addTag('Employee Documents')
        .addTag('Document Types')
        .addTag('Contract Templates')
        .addTag('Employee Contracts')
        .addTag('Contract Signatures')
        .addTag('KPI Templates')
        .addTag('KPI Assignments')
        .addTag('Performance Review Cycles')
        .addTag('Performance Reviews')
        .addTag('Dashboard')
        .addTag('Reports')
        .addTag('Exports')
        .addTag('System Settings')
        .addTag('Notification Preferences')
        .addTag('Jobs')
        .addTag('Audit Logs')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
    });
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port, '0.0.0.0');
    common_1.Logger.log(`MovieLegend HRM API listening on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map