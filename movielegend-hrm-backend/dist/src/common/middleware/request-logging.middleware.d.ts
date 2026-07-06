import { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
export declare class RequestLoggingMiddleware implements NestMiddleware {
    private readonly logger;
    use(req: Request & {
        requestId?: string;
    }, res: Response, next: NextFunction): void;
}
