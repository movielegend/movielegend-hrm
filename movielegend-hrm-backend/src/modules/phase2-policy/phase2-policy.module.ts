import { Module } from '@nestjs/common';
import { DepartmentScopeService } from './department-scope.service';

@Module({
  providers: [DepartmentScopeService],
  exports: [DepartmentScopeService],
})
export class Phase2PolicyModule {}
