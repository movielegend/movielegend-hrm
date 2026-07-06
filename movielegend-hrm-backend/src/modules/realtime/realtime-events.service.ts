import { Injectable } from '@nestjs/common';

@Injectable()
export class RealtimeEventsService {
  private emitFn?: (room: string, event: string, payload: unknown) => void;

  bind(emitFn: (room: string, event: string, payload: unknown) => void): void {
    this.emitFn = emitFn;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.emitFn?.(`user:${userId}`, event, payload);
  }

  emitToDepartment(departmentId: string, event: string, payload: unknown): void {
    this.emitFn?.(`department:${departmentId}`, event, payload);
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    this.emitFn?.(room, event, payload);
  }
}
