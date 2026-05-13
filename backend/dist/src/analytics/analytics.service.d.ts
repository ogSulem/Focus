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
    getBurnoutIndex(userId: string): Promise<BurnoutIndexPayload>;
    getProductivityArchetype(userId: string): Promise<ArchetypePayload>;
    getVelocityForecast(userId: string): Promise<VelocityForecastPayload>;
    getFocusDepth(userId: string): Promise<FocusDepthPayload>;
    getHabitCorrelation(userId: string): Promise<HabitCorrelationPayload>;
    getScenarioSimulator(userId: string): Promise<ScenarioSimulatorPayload>;
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
export interface BurnoutIndexPayload {
    burnoutIndex: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    suggestions: string[];
    modelFormula: string;
}
export type ArchetypeType = 'MORNING_PEAK' | 'DEADLINE_DRIVEN' | 'DEEP_WORK_FOCUSED' | 'HABIT_BUILDER' | 'BALANCED' | 'UNKNOWN';
export interface ArchetypePayload {
    archetype: ArchetypeType;
    label: string;
    description: string;
    confidence: number;
    traits: string[];
    rawScores?: {
        morningPeak: number;
        deadlineDriven: number;
        deepWork: number;
        habitBuilder: number;
    };
    peakWindow?: string;
}
export interface VelocityForecastPayload {
    historicalWeeks: {
        weekLabel: string;
        completed: number;
    }[];
    forecast: number;
    confidenceInterval: {
        low: number;
        high: number;
    };
    trend: 'growing' | 'declining' | 'stable';
    trendSlope: number;
    rSquared: number;
    modelFormula: string;
}
export interface FocusDepthPayload {
    flowStateScore: number;
    level: 'none' | 'distracted' | 'shallow' | 'flow' | 'deep-flow';
    deepWorkIndex: number;
    sessionConsistency: number;
    avgSessionMin: number;
    longestStreakDays: number;
    peakHourBlock: 'morning' | 'afternoon' | 'evening' | 'night' | null;
    hourBlocks: {
        label: string;
        key: 'morning' | 'afternoon' | 'evening' | 'night';
        count: number;
        isPeak: boolean;
    }[];
    modelFormula: string;
    insights: string[];
}
export interface HabitCorrelationItem {
    habitId: string;
    habitName: string;
    r: number;
    direction: 'positive' | 'negative' | 'neutral';
    activeDays: number;
    interpretation: string;
}
export interface HabitCorrelationPayload {
    correlations: HabitCorrelationItem[];
    summary: string;
    modelFormula: string;
    dataWindowDays: number;
}
export interface ScenarioResult {
    key: 'focus-sprint' | 'habit-discipline' | 'hybrid-excellence';
    title: string;
    projectedCompletedTasksWeekly: number;
    upliftPercent: number;
    assumptions: string[];
}
export interface ScenarioSimulatorPayload {
    baseline: {
        completedTasksWeekly: number;
        avgFocusMinPerDay: number;
        avgHabitCompletionsPerDay: number;
    };
    scenarios: ScenarioResult[];
    bestScenarioKey: ScenarioResult['key'] | null;
    confidence: 'low' | 'medium' | 'high';
    modelFormula: string;
    explanation: string;
}
