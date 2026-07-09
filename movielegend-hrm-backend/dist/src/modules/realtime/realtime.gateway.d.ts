import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RealtimeEventsService } from './realtime-events.service';
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
    private readonly jwt;
    private readonly config;
    private readonly realtime;
    server: Server;
    constructor(jwt: JwtService, config: ConfigService, realtime: RealtimeEventsService);
    afterInit(): void;
    handleConnection(client: Socket): Promise<void>;
    handleWarehouseJoin(client: Socket, payload: {
        warehouseId?: string;
    }): {
        ok: boolean;
        code: string;
    } | {
        ok: boolean;
        code?: undefined;
    };
    handleChatJoin(client: Socket, payload: {
        departmentId?: string;
        groupId?: string;
    }): {
        ok: boolean;
        code?: undefined;
    } | {
        ok: boolean;
        code: string;
    };
    private extractToken;
}
