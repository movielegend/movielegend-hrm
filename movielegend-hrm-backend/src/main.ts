import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
  } else {
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginOpenerPolicy: false,
      }),
    );
  }

  const corsOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:8081'
  )
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string,
    ) => `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port, '0.0.0.0');

  Logger.log(`MovieLegend HRM API listening on port ${port}`);
}

bootstrap();