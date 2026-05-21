import { Test } from '@nestjs/testing';
import { AiAnalystController } from './ai-analyst.controller';
import { AiAnalystService } from './ai-analyst.service';

describe('AiAnalystController', () => {
  let controller: AiAnalystController;
  let service: { analyze: jest.Mock };

  beforeEach(async () => {
    service = { analyze: jest.fn().mockResolvedValue({ ticker: 'PETR4' }) };
    const mod = await Test.createTestingModule({
      controllers: [AiAnalystController],
      providers: [{ provide: AiAnalystService, useValue: service }],
    }).compile();
    controller = mod.get(AiAnalystController);
  });

  it('delega ao service com userId e dto', async () => {
    await controller.analyze(
      { user: { id: 'u1' } },
      { ticker: 'PETR4', windowDays: 7 },
    );
    expect(service.analyze).toHaveBeenCalledWith('u1', 'PETR4', 7);
  });
});
