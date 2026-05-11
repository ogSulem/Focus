import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  EventsService,
  EventTimelineItem,
  ExperimentReport,
} from './events.service';

@ApiTags('events')
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user action timeline for audit/analytics' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTimeline(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ): Promise<EventTimelineItem[]> {
    return this.eventsService.timeline(user.sub, limit ? parseInt(limit, 10) : 40);
  }

  @Get('experiment-report')
  @ApiOperation({
    summary: 'Get before/after productivity report (last 14 days split into 7+7)',
  })
  getExperimentReport(@CurrentUser() user: JwtPayload): Promise<ExperimentReport> {
    return this.eventsService.getExperimentReport(user.sub);
  }
}
