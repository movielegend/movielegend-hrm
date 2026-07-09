import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
export declare const badRequest: (code: string, message: string) => BadRequestException;
export declare const conflict: (code: string, message: string) => ConflictException;
export declare const forbidden: (code: string, message: string) => ForbiddenException;
export declare const notFound: (code: string, message: string) => NotFoundException;
export declare const unauthorized: (code: string, message: string) => UnauthorizedException;
