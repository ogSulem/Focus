import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { HabitsModule } from './habits/habits.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TelegramModule } from './telegram/telegram.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { NotesModule } from './notes/notes.module';
import { GoalsModule } from './goals/goals.module';
import { FocusSessionsModule } from './focus-sessions/focus-sessions.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    UsersModule,
    AuthModule,
    TasksModule,
    HabitsModule,
    AnalyticsModule,
    TelegramModule,
    SchedulerModule,
    NotesModule,
    GoalsModule,
    FocusSessionsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
