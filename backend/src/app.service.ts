import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      service: 'Focus API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
