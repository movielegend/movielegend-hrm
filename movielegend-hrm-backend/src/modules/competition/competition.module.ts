import { Module } from '@nestjs/common';
import { CompetitionService } from './competition.service';
import { CompetitionController } from './competition.controller';
import { DatabaseModule } from '../../database/database.module';

import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';

@Module({
  imports: [DatabaseModule, Phase2PolicyModule],
  controllers: [CompetitionController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}
