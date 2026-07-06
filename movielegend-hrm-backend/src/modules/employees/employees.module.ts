import { Module } from '@nestjs/common';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({ imports: [Phase2PolicyModule], controllers: [EmployeesController], providers: [EmployeesService] })
export class EmployeesModule {}
