import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StorageModule } from '../storage/storage.module';
import { ContractStatePolicy } from './contract-state-policy.service';
import { ContractTemplatesController, EmployeeContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { DocumentIntegrityService } from './document-integrity.service';
import { ContractFieldPresetController } from './contract-field-preset.controller';
import { ContractFieldPresetService } from './contract-field-preset.service';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule, NotificationsModule, RealtimeModule, StorageModule],
  controllers: [ContractTemplatesController, EmployeeContractsController, ContractFieldPresetController],
  providers: [ContractsService, ContractStatePolicy, DocumentIntegrityService, ContractFieldPresetService],
  exports: [ContractsService, ContractStatePolicy, DocumentIntegrityService, ContractFieldPresetService],
})
export class ContractsModule {}
