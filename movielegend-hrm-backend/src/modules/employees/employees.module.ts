import { Module } from '@nestjs/common';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { StorageModule } from '../storage/storage.module';

@Module({ imports: [Phase2PolicyModule, StorageModule], controllers: [EmployeesController], providers: [EmployeesService] })
export class EmployeesModule {}
