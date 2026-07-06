import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export const badRequest = (code: string, message: string) => new BadRequestException({ code, message });
export const conflict = (code: string, message: string) => new ConflictException({ code, message });
export const forbidden = (code: string, message: string) => new ForbiddenException({ code, message });
export const notFound = (code: string, message: string) => new NotFoundException({ code, message });
export const unauthorized = (code: string, message: string) => new UnauthorizedException({ code, message });
