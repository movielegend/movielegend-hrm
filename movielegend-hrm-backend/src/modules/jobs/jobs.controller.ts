import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @Permissions('job.read')
  list() {
    return this.jobs.list();
  }

  @Get('logs')
  @Permissions('job.read')
  logs() {
    return this.jobs.logs();
  }

  @Post(':jobName/run')
  @Permissions('job.run_manual')
  run(@Param('jobName') jobName: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.jobs.run(jobName, actor);
  }
}
