export declare class RealtimeEventsService {
    private emitFn?;
    bind(emitFn: (room: string, event: string, payload: unknown) => void): void;
    emitToUser(userId: string, event: string, payload: unknown): void;
    emitToDepartment(departmentId: string, event: string, payload: unknown): void;
    emitToRoom(room: string, event: string, payload: unknown): void;
}
