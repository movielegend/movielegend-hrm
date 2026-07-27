import { Test, TestingModule } from '@nestjs/testing';
import { VoiceCallGateway } from './voice-call.gateway';

describe('VoiceCallGateway', () => {
  let gateway: VoiceCallGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoiceCallGateway],
    }).compile();

    gateway = module.get<VoiceCallGateway>(VoiceCallGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
