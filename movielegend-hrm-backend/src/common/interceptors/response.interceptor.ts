import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((value) => {
        if (this.isWrapped(value)) return value as ApiResponse<T>;
        return { success: true, data: value };
      }),
    );
  }

  private isWrapped(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'success' in value;
  }
}
