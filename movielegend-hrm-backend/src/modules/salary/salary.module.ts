import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SalaryComponentsController, SalaryProfilesController } from './salary.controller';
import { SalaryService } from './salary.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SalaryProfilesController, SalaryComponentsController],
  providers: [SalaryService],
  exports: [SalaryService],
})
export class SalaryModule {}
