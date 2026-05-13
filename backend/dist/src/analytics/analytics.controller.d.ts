import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AnalyticsService, AnalyticsSummary, ArchetypePayload, BurnoutIndexPayload, FocusDepthPayload, HabitCorrelationPayload, HeatmapDay, IntelligencePayload, OverviewPayload, ProductivityPoint, RecommendationPayload, TrendsPayload, VelocityForecastPayload } from './analytics.service';
import { ExperimentReport } from '../events/events.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOverview(user: JwtPayload): Promise<OverviewPayload>;
    getWeekly(user: JwtPayload): Promise<ProductivityPoint[]>;
    getMonthly(user: JwtPayload): Promise<ProductivityPoint[]>;
    getSummary(user: JwtPayload): Promise<AnalyticsSummary>;
    getRecommendations(user: JwtPayload): Promise<RecommendationPayload>;
    getIntelligence(user: JwtPayload, energy?: 'low' | 'medium' | 'high'): Promise<IntelligencePayload>;
    getExperimentReport(user: JwtPayload): Promise<ExperimentReport>;
    getTrends(user: JwtPayload): Promise<TrendsPayload>;
    getHeatmap(user: JwtPayload): Promise<HeatmapDay[]>;
    getBurnoutIndex(user: JwtPayload): Promise<BurnoutIndexPayload>;
    getArchetype(user: JwtPayload): Promise<ArchetypePayload>;
    getVelocityForecast(user: JwtPayload): Promise<VelocityForecastPayload>;
    getFocusDepth(user: JwtPayload): Promise<FocusDepthPayload>;
    getHabitCorrelation(user: JwtPayload): Promise<HabitCorrelationPayload>;
}
