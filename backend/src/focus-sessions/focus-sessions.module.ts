import { Module } from '@nestjs/common';
import { FocusSessionsService } from './focus-sessions.service';
import { FocusSessionsController } from './focus-sessions.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [FocusSessionsService],
  controllers: [FocusSessionsController],
})
export class FocusSessionsModule {}
