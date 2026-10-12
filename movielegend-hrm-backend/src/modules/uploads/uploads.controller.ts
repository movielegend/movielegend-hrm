import { Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UploadsService } from './uploads.service';

interface UploadRequest extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Uploads')
@ApiBearerAuth()
@SkipThrottle()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

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
