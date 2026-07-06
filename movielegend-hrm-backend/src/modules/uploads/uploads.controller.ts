import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UploadsService } from './uploads.service';

interface UploadRequest extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'purpose'],
      properties: {
        purpose: { type: 'string', enum: ['FACE_REGISTRATION', 'ATTENDANCE', 'TASK_ATTACHMENT', 'EMPLOYEE_DOCUMENT', 'CONTRACT_TEMPLATE', 'SIGNATURE', 'KPI_EVIDENCE', 'ASSET_INCIDENT'] },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post()
  upload(@Req() request: UploadRequest) {
    return this.uploadsService.uploadFromRequest(request, request.user);
  }
}
