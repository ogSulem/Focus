import { TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService, ExperimentReport } from '../events/events.service';
export interface ProductivityPoint {
    date: string;
    completedTasksCount: number;
    totalTasksCount: number;
}
export interface RecommendationPayload {
    recommendations: string[];
    scored?: ScoredRecommendation[];
    activityBuckets?: {
        morning: number;
        afternoon: number;
        evening: number;
        night: number;
    };
}
export interface AnalyticsSummary {
    tasks: {
        total: number;
        done: number;
        inProgress: number;
        todo: number;
        overdue: number;
        completionRate: number;
        avgCompletionDays: number | null;
    };
    habits: {
        total: number;
        totalStreakDays: number;
        longestStreak: number;
        avgStreak: number;
    };
    productivity: {
        bestDayOfWeek: string | null;
        avgDailyCompleted: number;
        peakHour: string | null;
    };
}
export interface ScoredRecommendation {
    title: string;
    description: string;
    score: number;
    reason: string;
}
export interface PlannedTask {
    id: string;
    title: string;
    score: number;
    priority: TaskPriority;
    status: TaskStatus;
    deadline: string | null;
    recommendedWindow: 'morning' | 'afternoon' | 'evening' | 'night';
    reasons: string[];
}
export interface TaskRiskForecast {
    id: string;
    title: string;
    riskPercent: number;
    factors: string[];
}
export interface HabitForecast {
    id: string;
    name: string;
    probability7dPercent: number;
    confidence: 'low' | 'medium' | 'high';
}
export interface IntelligencePayload {
    adaptivePlanning: {
        energyLevel: 'low' | 'medium' | 'high';
        prioritizedTasks: PlannedTask[];
    };
    predictions: {
        deadlineRisk: TaskRiskForecast[];
        habitSuccess: HabitForecast[];
    };
    recommendations: ScoredRecommendation[];
    modelMeta: {
        planningFormula: string;
        predictionFormula: string;
        explainability: string;
    };
}
export declare class AnalyticsService {
    private readonly prisma;
    private readonly eventsService;
    constructor(prisma: PrismaService, eventsService: EventsService);
    getWeekly(userId: string): Promise<ProductivityPoint[]>;
    getMonthly(userId: string): Promise<ProductivityPoint[]>;
    getSummary(userId: string): Promise<AnalyticsSummary>;
    getRecommendations(userId: string): Promise<RecommendationPayload>;
    getIntelligence(userId: string, energyLevel?: 'low' | 'medium' | 'high'): Promise<IntelligencePayload>;
    getExperimentReport(userId: string): Promise<ExperimentReport>;
    getOverview(userId: string): Promise<OverviewPayload>;
    getHeatmap(userId: string): Promise<HeatmapDay[]>;
    private getForPeriod;
    getTrends(userId: string): Promise<TrendsPayload>;
    private buildTaskPlan;
    private buildTaskRiskForecast;
    private buildHabitForecast;
    private extractActivityBuckets;
}
export interface TrendsPayload {
    completedTasks: {
        current: number;
        previous: number;
        changePercent: number;
    };
    totalTasks: {
        current: number;
        previous: number;
        changePercent: number;
    };
    habitCompletions: {
        current: number;
        previous: number;
        changePercent: number;
    };
    trend: 'up' | 'down' | 'neutral';
}
export interface HeatmapDay {
    date: string;
    count: number;
    tasksDone: number;
    habitsDone: number;
}
export interface WeekDayPoint {
    day: string;
    fullDay: string;
    count: number;
}
export interface OverviewPayload {
    summary: AnalyticsSummary;
    monthly: ProductivityPoint[];
    trends: TrendsPayload;
    activityBuckets: {
        morning: number;
        afternoon: number;
        evening: number;
        night: number;
    };
    weekByDay: WeekDayPoint[];
    productivityScore: number;
}
