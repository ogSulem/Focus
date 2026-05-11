import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  AnalyticsService,
  AnalyticsSummary,
  ArchetypePayload,
  BurnoutIndexPayload,
  HeatmapDay,
  IntelligencePayload,
  OverviewPayload,
  ProductivityPoint,
  RecommendationPayload,
  TrendsPayload,
  VelocityForecastPayload,
} from './analytics.service';
import { ExperimentReport } from '../events/events.service';

@ApiTags('analytics')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Single-call analytics overview: summary + monthly + trends + time-of-day + week-by-day + score',
  })
  getOverview(@CurrentUser() user: JwtPayload): Promise<OverviewPayload> {
    return this.analyticsService.getOverview(user.sub);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly productivity chart data' })
  getWeekly(@CurrentUser() user: JwtPayload): Promise<ProductivityPoint[]> {
    return this.analyticsService.getWeekly(user.sub);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly productivity chart data' })
  getMonthly(@CurrentUser() user: JwtPayload): Promise<ProductivityPoint[]> {
    return this.analyticsService.getMonthly(user.sub);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get comprehensive analytics summary' })
  getSummary(@CurrentUser() user: JwtPayload): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary(user.sub);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI-powered behaviour recommendations' })
  getRecommendations(
    @CurrentUser() user: JwtPayload,
  ): Promise<RecommendationPayload> {
    return this.analyticsService.getRecommendations(user.sub);
  }

  @Get('intelligence')
  @ApiOperation({
    summary:
      'Adaptive planning + risk forecasts + explainable score recommendations',
  })
  @ApiQuery({
    name: 'energy',
    required: false,
    enum: ['low', 'medium', 'high'],
  })
  getIntelligence(
    @CurrentUser() user: JwtPayload,
    @Query('energy') energy?: 'low' | 'medium' | 'high',
  ): Promise<IntelligencePayload> {
    return this.analyticsService.getIntelligence(user.sub, energy ?? 'medium');
  }

  @Get('experiment-report')
  @ApiOperation({
    summary:
      'Scientific before/after report for the last 14 days (7 days vs previous 7 days)',
  })
  getExperimentReport(
    @CurrentUser() user: JwtPayload,
  ): Promise<ExperimentReport> {
    return this.analyticsService.getExperimentReport(user.sub);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Week-over-week trends comparison' })
  getTrends(@CurrentUser() user: JwtPayload): Promise<TrendsPayload> {
    return this.analyticsService.getTrends(user.sub);
  }

  @Get('heatmap')
  @ApiOperation({
    summary: 'Full-year GitHub-style activity heatmap (tasks + habits)',
  })
  getHeatmap(@CurrentUser() user: JwtPayload): Promise<HeatmapDay[]> {
    return this.analyticsService.getHeatmap(user.sub);
  }
}

  @Get('burnout-index')
  @ApiOperation({
    summary:
      'Cognitive load / burnout detection index (0–100) with factors and suggestions',
  })
  getBurnoutIndex(@CurrentUser() user: JwtPayload): Promise<BurnoutIndexPayload> {
    return this.analyticsService.getBurnoutIndex(user.sub);
  }

  @Get('archetype')
  @ApiOperation({
    summary:
      'Classify user productivity archetype based on historical task and habit patterns',
  })
  getArchetype(@CurrentUser() user: JwtPayload): Promise<ArchetypePayload> {
    return this.analyticsService.getProductivityArchetype(user.sub);
  }

  @Get('velocity-forecast')
  @ApiOperation({
    summary:
      'OLS linear regression velocity forecast: predicted completed tasks for next week + confidence interval',
  })
  getVelocityForecast(@CurrentUser() user: JwtPayload): Promise<VelocityForecastPayload> {
    return this.analyticsService.getVelocityForecast(user.sub);
  }
}
