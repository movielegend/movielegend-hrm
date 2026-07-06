import { Module } from '@nestjs/common';
import { Phase2PolicyModule } from '../phase2-policy/phase2-policy.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

@Module({
  imports: [Phase2PolicyModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}
