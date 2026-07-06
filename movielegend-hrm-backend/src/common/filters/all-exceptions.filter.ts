import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorBody = string | { message?: string | string[]; error?: string; code?: string };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? (exception.getResponse() as ErrorBody) : undefined;
    const message = this.resolveMessage(body, exception);
    const code = typeof body === 'object' && body?.code ? body.code : this.codeFromStatus(status);

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
    });
  }

  private resolveMessage(body: ErrorBody | undefined, exception: unknown): string {
    if (typeof body === 'string') return body;
    if (Array.isArray(body?.message)) return body.message.join('; ');
    if (body?.message) return body.message;
    if (exception instanceof Error && exception.message) return exception.message;
    return 'Có lỗi xảy ra';
  }

  private codeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMITED',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'ERROR';
  }
}
