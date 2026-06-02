import { strict as assert } from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return service health payload', () => {
      const payload = appController.getHealth();
      assert.equal(payload.service, 'Focus API');
      assert.equal(payload.status, 'ok');
      assert.equal(typeof payload.timestamp, 'string');
    });
  });
});
