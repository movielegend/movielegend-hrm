import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
