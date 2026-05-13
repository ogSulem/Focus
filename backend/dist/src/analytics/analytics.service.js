"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const events_service_1 = require("../events/events.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    eventsService;
    constructor(prisma, eventsService) {
        this.prisma = prisma;
        this.eventsService = eventsService;
    }
    async getWeekly(userId) {
        return this.getForPeriod(userId, 7);
    }
    async getMonthly(userId) {
        return this.getForPeriod(userId, 30);
    }
    async getSummary(userId) {
        const tasks = await this.prisma.task.findMany({
            where: { userId },
            select: {
                status: true,
                priority: true,
                deadline: true,
                createdAt: true,
                completedAt: true,
            },
        });
        const habits = await this.prisma.habit.findMany({
            where: { userId },
            select: { streak: true, completedDays: true },
        });
        const now = new Date();
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === 'DONE').length;
        const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const todo = tasks.filter((t) => t.status === 'TODO').length;
        const overdue = tasks.filter((t) => t.deadline && t.deadline < now && t.status !== 'DONE').length;
        const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
        const completedWithBothDates = tasks.filter((t) => t.status === 'DONE' && t.completedAt);
        const avgCompletionDays = completedWithBothDates.length > 0
            ? Math.round(completedWithBothDates.reduce((acc, t) => acc +
                (t.completedAt.getTime() - t.createdAt.getTime()) / 86_400_000, 0) / completedWithBothDates.length)
            : null;
        const habitStreaks = habits.map((h) => h.streak);
        const totalStreakDays = habitStreaks.reduce((a, b) => a + b, 0);
        const longestStreak = habitStreaks.length > 0 ? Math.max(...habitStreaks) : 0;
        const avgStreak = habits.length > 0 ? Math.round(totalStreakDays / habits.length) : 0;
        const dayBuckets = Array(7).fill(0);
        const doneTasks = tasks.filter((t) => t.completedAt);
        doneTasks.forEach((t) => {
            dayBuckets[t.completedAt.getDay()] += 1;
        });
        const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const bestDayIndex = dayBuckets.indexOf(Math.max(...dayBuckets));
        const bestDayOfWeek = doneTasks.length > 0 ? dayNames[bestDayIndex] : null;
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const recentDone = tasks.filter((t) => t.completedAt && t.completedAt >= thirtyDaysAgo).length;
        const avgDailyCompleted = Math.round((recentDone / 30) * 10) / 10;
        const hourBuckets = Array(24).fill(0);
        doneTasks.forEach((t) => {
            hourBuckets[t.completedAt.getHours()] += 1;
        });
        const peakHourIndex = hourBuckets.indexOf(Math.max(...hourBuckets));
        const peakHour = doneTasks.length > 0
            ? `${peakHourIndex}:00–${peakHourIndex + 1}:00`
            : null;
        return {
            tasks: {
                total,
                done,
                inProgress,
                todo,
                overdue,
                completionRate,
                avgCompletionDays,
            },
            habits: {
                total: habits.length,
                totalStreakDays,
                longestStreak,
                avgStreak,
            },
            productivity: {
                bestDayOfWeek,
                avgDailyCompleted,
                peakHour,
            },
        };
    }
    async getRecommendations(userId) {
        const intelligence = await this.getIntelligence(userId, 'medium');
        const scored = intelligence.recommendations.slice(0, 6);
        const toEmoji = (score) => score >= 80 ? '🚀' : score >= 60 ? '💡' : '🧭';
        await this.eventsService.track(userId, client_1.UserEventType.RECOMMENDATION_VIEWED, {
            score: scored.length > 0
                ? Math.round(scored.reduce((acc, recommendation) => acc + recommendation.score, 0) / scored.length)
                : 0,
            payload: {
                count: scored.length,
            },
        });
        return {
            recommendations: scored.map((recommendation) => `${toEmoji(recommendation.score)} ${recommendation.title}: ${recommendation.description}`),
            scored,
            activityBuckets: this.extractActivityBuckets(intelligence.adaptivePlanning.prioritizedTasks),
        };
    }
    async getIntelligence(userId, energyLevel = 'medium') {
        const [tasks, habits, allTasks] = await Promise.all([
            this.prisma.task.findMany({
                where: { userId, status: client_1.TaskStatus.DONE, completedAt: { not: null } },
                select: { completedAt: true, createdAt: true },
                orderBy: { completedAt: 'desc' },
                take: 300,
            }),
            this.prisma.habit.findMany({
                where: { userId },
                select: { id: true, streak: true, completedDays: true, name: true },
            }),
            this.prisma.task.findMany({
                where: { userId },
                select: { status: true, priority: true, deadline: true },
            }),
        ]);
        const recs = [];
        const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        const pendingTasks = await this.prisma.task.findMany({
            where: { userId, status: { not: client_1.TaskStatus.DONE } },
            select: {
                id: true,
                title: true,
                priority: true,
                status: true,
                deadline: true,
                createdAt: true,
            },
            take: 200,
            orderBy: { createdAt: 'asc' },
        });
        const focusSessions = await this.prisma.focusSession.findMany({
            where: { userId, phase: 'focus' },
            select: { durationMin: true, completedAt: true },
            take: 400,
            orderBy: { completedAt: 'desc' },
        });
        if (tasks.length === 0) {
            const coldStartRecommendations = [
                {
                    title: 'Начните с ритма 3 задач в день',
                    description: 'Сформируйте базовый ритм на 5–7 дней, чтобы модель начала давать персонализированные прогнозы.',
                    score: 74,
                    reason: 'Недостаточно исторических данных для персонального профиля.',
                },
                {
                    title: 'Добавьте привычки-стабилизаторы',
                    description: 'Введите 1–2 ежедневные привычки (планирование, deep work), это улучшит предсказуемость продуктивности.',
                    score: 68,
                    reason: 'Стабильные привычки увеличивают качество прогноза.',
                },
            ];
            return {
                adaptivePlanning: {
                    energyLevel,
                    prioritizedTasks: [],
                },
                predictions: {
                    deadlineRisk: [],
                    habitSuccess: [],
                },
                recommendations: coldStartRecommendations,
                modelMeta: {
                    planningFormula: 'score = urgency + priority + age + energyFit + focusFit - overloadPenalty',
                    predictionFormula: 'risk = deadlinePressure + backlogPressure - executionConsistency',
                    explainability: 'Каждый результат сопровождается факторами и вкладом в итоговый score.',
                },
            };
        }
        tasks.forEach((task) => {
            const hour = task.completedAt?.getHours() ?? 0;
            if (hour >= 6 && hour < 12)
                buckets.morning += 1;
            else if (hour >= 12 && hour < 18)
                buckets.afternoon += 1;
            else if (hour >= 18 && hour < 24)
                buckets.evening += 1;
            else
                buckets.night += 1;
        });
        const periodMap = {
            morning: 'утро (6–12)',
            afternoon: 'день (12–18)',
            evening: 'вечер (18–24)',
            night: 'ночь (0–6)',
        };
        const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
        const bestPeriod = sorted[0]?.[0] ?? 'morning';
        const worstPeriod = sorted[sorted.length - 1]?.[0] ?? 'night';
        recs.push({
            title: `Пик продуктивности: ${periodMap[bestPeriod]}`,
            description: 'Ставьте стратегические и сложные задачи в это окно — вероятность завершения выше.',
            score: 88,
            reason: `Максимальная историческая активность в период ${periodMap[bestPeriod]}.`,
        });
        const dayBuckets = Array(7).fill(0);
        tasks.forEach((t) => {
            if (t.completedAt)
                dayBuckets[t.completedAt.getDay()] += 1;
        });
        const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const bestDayIdx = dayBuckets.indexOf(Math.max(...dayBuckets));
        if (dayBuckets[bestDayIdx] > 0) {
            recs.push({
                title: `Сильный день недели: ${dayNames[bestDayIdx]}`,
                description: 'Планируйте на этот день задачи с высокой ценностью и дедлайнами.',
                score: 79,
                reason: `На ${dayNames[bestDayIdx]} приходится максимум выполненных задач.`,
            });
        }
        if (buckets[worstPeriod] < tasks.length * 0.1) {
            recs.push({
                title: `Провал активности: ${periodMap[worstPeriod]}`,
                description: 'Оставляйте на это окно рутину и микрозадачи, а не критичные deliverables.',
                score: 72,
                reason: 'В окне активности зафиксирован минимальный объём завершений.',
            });
        }
        const now = new Date();
        const overdue = allTasks.filter((t) => t.deadline && t.deadline < now && t.status !== client_1.TaskStatus.DONE).length;
        if (overdue > 0) {
            recs.push({
                title: `Просрочки в бэклоге: ${overdue}`,
                description: 'Сначала закройте просроченные задачи или пересогласуйте дедлайны, чтобы снизить риск срыва плана.',
                score: 91,
                reason: 'Просрочки оказывают максимальное негативное влияние на прогноз.',
            });
        }
        const highPrioTodo = allTasks.filter((t) => t.priority === 'HIGH' && t.status === client_1.TaskStatus.TODO).length;
        if (highPrioTodo > 0) {
            recs.push({
                title: `Высокий приоритет в очереди: ${highPrioTodo}`,
                description: 'Переведите хотя бы одну high-priority задачу в IN_PROGRESS в текущий рабочий блок.',
                score: 84,
                reason: 'Сейчас критичные задачи стоят в очереди без активного исполнения.',
            });
        }
        const bestHabit = habits.sort((a, b) => b.streak - a.streak)[0];
        if (bestHabit && bestHabit.streak >= 7) {
            recs.push({
                title: `Сильная привычка: ${bestHabit.name}`,
                description: `Сохраните streak (${bestHabit.streak} дн.) — это усиливает устойчивость рабочих циклов.`,
                score: 77,
                reason: 'Высокий streak коррелирует с ростом ежедневного completion rate.',
            });
        }
        const recent7 = tasks.filter((t) => {
            if (!t.completedAt)
                return false;
            const diff = (now.getTime() - t.completedAt.getTime()) / 86_400_000;
            return diff <= 7;
        }).length;
        const dailyRate = Math.round((recent7 / 7) * 10) / 10;
        if (dailyRate > 0) {
            recs.push({
                title: `Темп выполнения: ${dailyRate} задач/день`,
                description: dailyRate >= 3
                    ? 'Стабильный высокий темп — можно добавлять более амбициозные цели.'
                    : 'Добавьте 1–2 задачи в день для выхода на устойчивый режим.',
                score: dailyRate >= 3 ? 83 : 66,
                reason: 'Оценка строится на последних 7 днях реального выполнения.',
            });
        }
        const focusAvg = focusSessions.length > 0
            ? Math.round(focusSessions.reduce((acc, session) => acc + session.durationMin, 0) / focusSessions.length)
            : 25;
        recs.push({
            title: 'Управление энергией через focus-сессии',
            description: `Ваш оптимальный фокус-блок сейчас около ${focusAvg} мин. Настройте deep work под этот интервал.`,
            score: 70,
            reason: 'Рекомендация вычислена по истории focus-сессий.',
        });
        const prioritizedTasks = this.buildTaskPlan(pendingTasks, energyLevel, bestPeriod, focusAvg);
        const deadlineRisk = this.buildTaskRiskForecast(pendingTasks, allTasks.length > 0 ? overdue / allTasks.length : 0, tasks.length > 0 ? recent7 / 7 : 0);
        const habitSuccess = this.buildHabitForecast(habits);
        return {
            adaptivePlanning: {
                energyLevel,
                prioritizedTasks: prioritizedTasks.slice(0, 8),
            },
            predictions: {
                deadlineRisk: deadlineRisk.slice(0, 8),
                habitSuccess,
            },
            recommendations: recs.sort((a, b) => b.score - a.score).slice(0, 6),
            modelMeta: {
                planningFormula: 'score = deadlinePressure(35) + priority(25) + waitingTime(15) + energyFit(15) + focusFit(10)',
                predictionFormula: 'risk = overdueSignal + deadlineDistance + backlogLoad - executionVelocity',
                explainability: 'Каждый прогноз и приоритизация возвращают список факторов (reasons/factors), влияющих на итог.',
            },
        };
    }
    async getExperimentReport(userId) {
        return this.eventsService.getExperimentReport(userId);
    }
    async getOverview(userId) {
        const [summary, monthly, trends] = await Promise.all([
            this.getSummary(userId),
            this.getMonthly(userId),
            this.getTrends(userId),
        ]);
        const doneTasks = await this.prisma.task.findMany({
            where: { userId, status: client_1.TaskStatus.DONE, completedAt: { not: null } },
            select: { completedAt: true },
            orderBy: { completedAt: 'desc' },
            take: 500,
        });
        const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        const dayBuckets = Array(7).fill(0);
        doneTasks.forEach((t) => {
            const h = t.completedAt.getHours();
            if (h >= 6 && h < 12)
                buckets.morning += 1;
            else if (h >= 12 && h < 18)
                buckets.afternoon += 1;
            else if (h >= 18 && h < 24)
                buckets.evening += 1;
            else
                buckets.night += 1;
            dayBuckets[t.completedAt.getDay()] += 1;
        });
        const SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const FULL = [
            'Воскресенье',
            'Понедельник',
            'Вторник',
            'Среда',
            'Четверг',
            'Пятница',
            'Суббота',
        ];
        const ORDER = [1, 2, 3, 4, 5, 6, 0];
        const weekByDay = ORDER.map((i) => ({
            day: SHORT[i],
            fullDay: FULL[i],
            count: dayBuckets[i],
        }));
        const crScore = Math.min(summary.tasks.completionRate, 100);
        const habitScore = Math.min((summary.habits.avgStreak / 10) * 100, 100);
        const velocityScore = Math.min((summary.productivity.avgDailyCompleted / 5) * 100, 100);
        const productivityScore = Math.round(crScore * 0.4 + habitScore * 0.3 + velocityScore * 0.3);
        return {
            summary,
            monthly,
            trends,
            activityBuckets: buckets,
            weekByDay,
            productivityScore,
        };
    }
    async getHeatmap(userId) {
        const days = 365;
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);
        const toDateStr = (d) => d.toISOString().slice(0, 10);
        const map = new Map();
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = toDateStr(d);
            map.set(key, { date: key, count: 0, tasksDone: 0, habitsDone: 0 });
        }
        const doneTasks = await this.prisma.task.findMany({
            where: {
                userId,
                status: client_1.TaskStatus.DONE,
                completedAt: { gte: start },
            },
            select: { completedAt: true },
        });
        doneTasks.forEach((t) => {
            if (!t.completedAt)
                return;
            const key = toDateStr(t.completedAt);
            const day = map.get(key);
            if (day) {
                day.tasksDone += 1;
                day.count += 1;
            }
        });
        const habits = await this.prisma.habit.findMany({
            where: { userId },
            select: { completedDays: true },
        });
        habits.forEach((h) => {
            const completedDays = Array.isArray(h.completedDays)
                ? h.completedDays.filter((d) => typeof d === 'string')
                : [];
            completedDays.forEach((dateStr) => {
                if (dateStr >= toDateStr(start)) {
                    const day = map.get(dateStr);
                    if (day) {
                        day.habitsDone += 1;
                        day.count += 1;
                    }
                }
            });
        });
        return [...map.values()];
    }
    async getForPeriod(userId, days) {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);
        const tasks = await this.prisma.task.findMany({
            where: { userId, createdAt: { gte: start } },
            select: { createdAt: true, status: true },
        });
        const map = new Map();
        for (let i = 0; i < days; i += 1) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const key = date.toISOString().slice(0, 10);
            map.set(key, {
                date: key,
                completedTasksCount: 0,
                totalTasksCount: 0,
            });
        }
        tasks.forEach((task) => {
            const key = task.createdAt.toISOString().slice(0, 10);
            const point = map.get(key);
            if (!point)
                return;
            point.totalTasksCount += 1;
            if (task.status === client_1.TaskStatus.DONE) {
                point.completedTasksCount += 1;
            }
        });
        return [...map.values()];
    }
    async getTrends(userId) {
        const now = new Date();
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - 6);
        thisWeekStart.setHours(0, 0, 0, 0);
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        const thisWeekTasks = await this.prisma.task.findMany({
            where: { userId, createdAt: { gte: thisWeekStart } },
            select: { status: true },
        });
        const lastWeekTasks = await this.prisma.task.findMany({
            where: { userId, createdAt: { gte: lastWeekStart, lt: thisWeekStart } },
            select: { status: true },
        });
        const allHabits = await this.prisma.habit.findMany({
            where: { userId },
            select: { completedDays: true },
        });
        const toDateStr = (d) => d.toISOString().slice(0, 10);
        const thisWeekDates = new Set(Array.from({ length: 7 }, (_, i) => {
            const d = new Date(thisWeekStart);
            d.setDate(thisWeekStart.getDate() + i);
            return toDateStr(d);
        }));
        const lastWeekDates = new Set(Array.from({ length: 7 }, (_, i) => {
            const d = new Date(lastWeekStart);
            d.setDate(lastWeekStart.getDate() + i);
            return toDateStr(d);
        }));
        const countHabitDays = (habits, dateSet) => habits.reduce((acc, h) => {
            const days = Array.isArray(h.completedDays)
                ? h.completedDays.filter((d) => typeof d === 'string')
                : [];
            return acc + days.filter((d) => dateSet.has(d)).length;
        }, 0);
        const thisCompleted = thisWeekTasks.filter((t) => t.status === 'DONE').length;
        const prevCompleted = lastWeekTasks.filter((t) => t.status === 'DONE').length;
        const thisTotal = thisWeekTasks.length;
        const prevTotal = lastWeekTasks.length;
        const thisHabits = countHabitDays(allHabits, thisWeekDates);
        const prevHabits = countHabitDays(allHabits, lastWeekDates);
        function pct(curr, prev) {
            if (prev === 0)
                return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        }
        const completedChange = pct(thisCompleted, prevCompleted);
        const trend = completedChange > 5 ? 'up' : completedChange < -5 ? 'down' : 'neutral';
        return {
            completedTasks: {
                current: thisCompleted,
                previous: prevCompleted,
                changePercent: completedChange,
            },
            totalTasks: {
                current: thisTotal,
                previous: prevTotal,
                changePercent: pct(thisTotal, prevTotal),
            },
            habitCompletions: {
                current: thisHabits,
                previous: prevHabits,
                changePercent: pct(thisHabits, prevHabits),
            },
            trend,
        };
    }
    buildTaskPlan(pendingTasks, energyLevel, bestWindow, avgFocusMinutes) {
        const now = Date.now();
        const priorityWeight = {
            HIGH: 25,
            MEDIUM: 16,
            LOW: 8,
        };
        return pendingTasks
            .map((task) => {
            const reasons = [];
            const ageDays = Math.max(0, (now - task.createdAt.getTime()) / 86_400_000);
            const ageScore = Math.min(ageDays * 1.5, 15);
            if (ageScore >= 8)
                reasons.push('долго в бэклоге');
            let deadlinePressure = 0;
            if (task.deadline) {
                const daysLeft = (task.deadline.getTime() - now) / 86_400_000;
                if (daysLeft <= 0) {
                    deadlinePressure = 35;
                    reasons.push('дедлайн уже просрочен');
                }
                else if (daysLeft <= 1) {
                    deadlinePressure = 30;
                    reasons.push('дедлайн в течение суток');
                }
                else if (daysLeft <= 3) {
                    deadlinePressure = 24;
                    reasons.push('дедлайн в ближайшие 3 дня');
                }
                else {
                    deadlinePressure = Math.max(6, 20 - daysLeft);
                }
            }
            else {
                deadlinePressure = 10;
            }
            const energyFit = energyLevel === 'high'
                ? task.priority === 'HIGH'
                    ? 15
                    : 10
                : energyLevel === 'low'
                    ? task.priority === 'LOW'
                        ? 15
                        : 8
                    : 12;
            const focusFit = Math.min(Math.max(avgFocusMinutes - 20, 0), 10);
            const score = Math.round(deadlinePressure +
                priorityWeight[task.priority] +
                ageScore +
                energyFit +
                focusFit);
            if (task.priority === 'HIGH')
                reasons.push('высокий приоритет');
            if (energyFit >= 12)
                reasons.push('соответствует текущему уровню энергии');
            return {
                id: task.id,
                title: task.title,
                score: Math.min(score, 100),
                priority: task.priority,
                status: task.status,
                deadline: task.deadline ? task.deadline.toISOString() : null,
                recommendedWindow: bestWindow,
                reasons,
            };
        })
            .sort((a, b) => b.score - a.score);
    }
    buildTaskRiskForecast(pendingTasks, overdueRatio, velocity) {
        const now = Date.now();
        return pendingTasks
            .map((task) => {
            const factors = [];
            let risk = 20 + overdueRatio * 30 - Math.min(velocity * 3, 15);
            const ageDays = (now - task.createdAt.getTime()) / 86_400_000;
            if (ageDays > 14) {
                risk += 15;
                factors.push('долго без завершения');
            }
            else if (ageDays > 7) {
                risk += 8;
                factors.push('задача в бэклоге более недели');
            }
            if (task.deadline) {
                const daysLeft = (task.deadline.getTime() - now) / 86_400_000;
                if (daysLeft <= 0) {
                    risk += 35;
                    factors.push('дедлайн уже нарушен');
                }
                else if (daysLeft <= 2) {
                    risk += 22;
                    factors.push('критически мало времени до дедлайна');
                }
                else if (daysLeft <= 5) {
                    risk += 12;
                    factors.push('короткое окно до дедлайна');
                }
            }
            else {
                factors.push('нет дедлайна, риск умеренный');
            }
            if (task.priority === 'HIGH') {
                risk += 8;
                factors.push('высокая цена просрочки');
            }
            return {
                id: task.id,
                title: task.title,
                riskPercent: Math.max(5, Math.min(99, Math.round(risk))),
                factors,
            };
        })
            .sort((a, b) => b.riskPercent - a.riskPercent);
    }
    buildHabitForecast(habits) {
        const now = new Date();
        const windowStart = new Date(now);
        windowStart.setDate(now.getDate() - 29);
        const startStr = windowStart.toISOString().slice(0, 10);
        return habits.map((habit) => {
            const days = Array.isArray(habit.completedDays)
                ? habit.completedDays.filter((day) => typeof day === 'string')
                : [];
            const completed30 = days.filter((day) => day >= startStr).length;
            const consistency = completed30 / 30;
            const streakBoost = Math.min(habit.streak / 30, 1) * 0.25;
            const probability = Math.round(Math.min((consistency + streakBoost) * 100, 99));
            return {
                id: habit.id,
                name: habit.name,
                probability7dPercent: Math.max(15, probability),
                confidence: completed30 >= 16 ? 'high' : completed30 >= 8 ? 'medium' : 'low',
            };
        });
    }
    extractActivityBuckets(tasks) {
        const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        tasks.forEach((task) => {
            buckets[task.recommendedWindow] += 1;
        });
        return buckets;
    }
    async getBurnoutIndex(userId) {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const [allOpenTasks, recentlyCompleted, habits, sessions] = await Promise.all([
            this.prisma.task.findMany({
                where: { userId, status: { not: client_1.TaskStatus.DONE } },
                select: { deadline: true, createdAt: true, priority: true },
            }),
            this.prisma.task.count({
                where: {
                    userId,
                    status: client_1.TaskStatus.DONE,
                    completedAt: { gte: sevenDaysAgo },
                },
            }),
            this.prisma.habit.findMany({
                where: { userId },
                select: { completedDays: true, streak: true },
            }),
            this.prisma.focusSession.findMany({
                where: { userId, phase: 'focus', completedAt: { gte: sevenDaysAgo } },
                select: { durationMin: true, completedAt: true },
            }),
        ]);
        const factors = [];
        const suggestions = [];
        const overdueTasks = allOpenTasks.filter((t) => t.deadline && t.deadline < now);
        const overdueHigh = overdueTasks.filter((t) => t.priority === 'HIGH').length;
        const overduePressure = allOpenTasks.length > 0
            ? Math.min(overdueTasks.length / Math.max(allOpenTasks.length, 1), 1)
            : 0;
        if (overduePressure > 0.4) {
            factors.push(`${overdueTasks.length} просроченных задач в работе`);
            suggestions.push('Переведите часть просроченных задач в архив или перенесите дедлайны');
        }
        if (overdueHigh > 0) {
            factors.push(`${overdueHigh} HIGH-priority задач просрочены`);
            suggestions.push('Сфокусируйтесь на блокерах с высоким приоритетом');
        }
        const oldTasks = allOpenTasks.filter((t) => (now.getTime() - t.createdAt.getTime()) / 86_400_000 > 14);
        const backlogDensity = allOpenTasks.length > 0
            ? Math.min(oldTasks.length / Math.max(allOpenTasks.length, 1), 1)
            : 0;
        if (backlogDensity > 0.3) {
            factors.push(`${oldTasks.length} задач не двигались более 2 недель`);
            suggestions.push('Проведите ревью бэклога: удалите/отложите неактуальное');
        }
        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(now.getDate() - 3);
        const last3 = Array.from({ length: 3 }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            return d.toISOString().slice(0, 10);
        });
        let brokenHabits = 0;
        habits.forEach((habit) => {
            const days = Array.isArray(habit.completedDays)
                ? habit.completedDays.filter((d) => typeof d === 'string')
                : [];
            const doneInLast3 = days.some((d) => last3.includes(d));
            if (!doneInLast3)
                brokenHabits += 1;
        });
        const habitGap = habits.length > 0 ? brokenHabits / habits.length : 0;
        if (habitGap > 0.5) {
            factors.push(`${brokenHabits} из ${habits.length} привычек не выполнены 3+ дня`);
            suggestions.push('Сократите список привычек до 2–3 ключевых для восстановления ритма');
        }
        const focusDays = new Set(sessions.map((session) => session.completedAt.toISOString().slice(0, 10)));
        const focusConsistency = Math.min(focusDays.size / 7, 1);
        if (focusConsistency < 0.3) {
            factors.push('Менее 2 фокус-сессий за последнюю неделю');
            suggestions.push('Запланируйте хотя бы 1 pomodoro-блок в день');
        }
        const completionMomentum = Math.min(recentlyCompleted / Math.max(7, 1), 1);
        if (completionMomentum < 0.3) {
            factors.push('Низкий темп завершений за последние 7 дней');
            suggestions.push('Начните с одной «быстрой победой» каждое утро');
        }
        const raw = overduePressure * 0.3 +
            backlogDensity * 0.25 +
            habitGap * 0.2 -
            focusConsistency * 0.15 -
            completionMomentum * 0.1;
        const burnoutIndex = Math.max(0, Math.min(100, Math.round(raw * 100)));
        let level;
        if (burnoutIndex >= 70)
            level = 'critical';
        else if (burnoutIndex >= 50)
            level = 'high';
        else if (burnoutIndex >= 30)
            level = 'medium';
        else
            level = 'low';
        return {
            burnoutIndex,
            level,
            factors: factors.slice(0, 5),
            suggestions: suggestions.slice(0, 4),
            modelFormula: 'burnoutIndex = 0.30·overduePressure + 0.25·backlogDensity + 0.20·habitGap - 0.15·focusConsistency - 0.10·completionMomentum',
        };
    }
    async getProductivityArchetype(userId) {
        const [tasks, habits, sessions] = await Promise.all([
            this.prisma.task.findMany({
                where: { userId, status: client_1.TaskStatus.DONE, completedAt: { not: null } },
                select: { completedAt: true, deadline: true, createdAt: true },
                take: 300,
                orderBy: { completedAt: 'desc' },
            }),
            this.prisma.habit.findMany({
                where: { userId },
                select: { streak: true, completedDays: true },
            }),
            this.prisma.focusSession.findMany({
                where: { userId, phase: 'focus' },
                select: { durationMin: true, completedAt: true },
                take: 200,
                orderBy: { completedAt: 'desc' },
            }),
        ]);
        if (tasks.length < 5) {
            return {
                archetype: 'UNKNOWN',
                label: 'Профиль формируется',
                description: 'Нужно больше данных. Выполните 10+ задач, чтобы система определила ваш паттерн.',
                confidence: 0,
                traits: [],
            };
        }
        const hourCounts = Array(24).fill(0);
        tasks.forEach((t) => {
            if (t.completedAt)
                hourCounts[t.completedAt.getHours()] += 1;
        });
        const morningCount = hourCounts.slice(5, 12).reduce((a, b) => a + b, 0);
        const afternoonCount = hourCounts.slice(12, 18).reduce((a, b) => a + b, 0);
        const eveningCount = hourCounts.slice(18, 24).reduce((a, b) => a + b, 0);
        const morningRatio = morningCount / Math.max(tasks.length, 1);
        const deadlineDrivenCount = tasks.filter((t) => {
            if (!t.deadline || !t.completedAt)
                return false;
            const diff = (t.completedAt.getTime() - t.deadline.getTime()) / 86_400_000;
            return diff >= -1 && diff <= 0;
        }).length;
        const deadlineDrivenRatio = deadlineDrivenCount / Math.max(tasks.length, 1);
        const avgFocus = sessions.length > 0
            ? sessions.reduce((a, s) => a + s.durationMin, 0) / sessions.length
            : 0;
        const avgStreak = habits.length > 0
            ? habits.reduce((a, h) => a + h.streak, 0) / habits.length
            : 0;
        const scores = {
            MORNING_PEAK: morningRatio,
            DEADLINE_DRIVEN: deadlineDrivenRatio,
            DEEP_WORK_FOCUSED: Math.min(avgFocus / 60, 1),
            HABIT_BUILDER: Math.min(avgStreak / 21, 1),
            BALANCED: Math.min((morningRatio +
                (1 - deadlineDrivenRatio) +
                Math.min(avgFocus / 45, 1) +
                Math.min(avgStreak / 14, 1)) /
                4, 1),
        };
        const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
        const archetypeKey = best[0];
        const confidence = Math.round(best[1] * 100);
        const META = {
            MORNING_PEAK: {
                label: 'Утренний пик',
                description: 'Максимальная продуктивность в ранние часы. Стратегические задачи лучше решаются до полудня.',
                traits: [
                    'Активен 5–12 ч',
                    'Быстрый старт рабочего дня',
                    'Энергия падает к вечеру',
                ],
            },
            DEADLINE_DRIVEN: {
                label: 'Deadline-ориентированный',
                description: 'Включается при приближении дедлайна. Высокая интенсивность в финальной фазе задачи.',
                traits: [
                    'Пиковый фокус перед сроком',
                    'Откладывает начало',
                    'Точно укладывается в сроки',
                ],
            },
            DEEP_WORK_FOCUSED: {
                label: 'Deep Work мастер',
                description: 'Предпочитает длинные непрерывные сессии. Высокая результативность в сложных задачах.',
                traits: [
                    `Avg фокус ${Math.round(avgFocus)} мин`,
                    'Минимум переключений',
                    'Сложные задачи > поверхностные',
                ],
            },
            HABIT_BUILDER: {
                label: 'Habit-строитель',
                description: 'Устойчивые привычки формируют продуктивность. Система и ритуалы важнее спринтов.',
                traits: [
                    `Avg streak ${Math.round(avgStreak)} дней`,
                    'Стабильный темп',
                    'Долгосрочная дисциплина',
                ],
            },
            BALANCED: {
                label: 'Сбалансированный',
                description: 'Равномерное распределение усилий между временными окнами и типами задач.',
                traits: [
                    'Стабильный темп',
                    'Равные паттерны активности',
                    'Устойчив к хаосу',
                ],
            },
        };
        const meta = META[archetypeKey] ?? META['BALANCED'];
        return {
            archetype: archetypeKey,
            label: meta.label,
            description: meta.description,
            confidence,
            traits: meta.traits,
            rawScores: {
                morningPeak: round1(morningRatio * 100),
                deadlineDriven: round1(deadlineDrivenRatio * 100),
                deepWork: round1(Math.min(avgFocus / 60, 1) * 100),
                habitBuilder: round1(Math.min(avgStreak / 21, 1) * 100),
            },
            peakWindow: morningCount > afternoonCount && morningCount > eveningCount
                ? '05:00–12:00'
                : afternoonCount > eveningCount
                    ? '12:00–18:00'
                    : '18:00–24:00',
        };
    }
    async getVelocityForecast(userId) {
        const WEEKS = 8;
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const weekPoints = [];
        for (let w = WEEKS - 1; w >= 0; w--) {
            const start = new Date(now);
            start.setDate(now.getDate() - (w + 1) * 7 + 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setDate(now.getDate() - w * 7);
            end.setHours(23, 59, 59, 999);
            const count = await this.prisma.task.count({
                where: {
                    userId,
                    status: client_1.TaskStatus.DONE,
                    completedAt: { gte: start, lte: end },
                },
            });
            const weekStart = start.toISOString().slice(0, 10);
            weekPoints.push({ weekLabel: weekStart, completed: count });
        }
        const n = weekPoints.length;
        const xs = weekPoints.map((_, i) => i);
        const ys = weekPoints.map((p) => p.completed);
        const xMean = xs.reduce((a, b) => a + b, 0) / n;
        const yMean = ys.reduce((a, b) => a + b, 0) / n;
        const ssXX = xs.reduce((acc, x) => acc + (x - xMean) ** 2, 0);
        const ssXY = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0);
        const beta1 = ssXX > 0 ? ssXY / ssXX : 0;
        const beta0 = yMean - beta1 * xMean;
        const xNext = n;
        const forecast = Math.max(0, Math.round(beta0 + beta1 * xNext));
        const residuals = ys.map((y, i) => y - (beta0 + beta1 * xs[i]));
        const sse = residuals.reduce((acc, r) => acc + r ** 2, 0);
        const se = n > 2 ? Math.sqrt(sse / (n - 2)) : 0;
        const margin = Math.round(1.28 * se * Math.sqrt(1 + 1 / n));
        const trend = beta1 > 0.2 ? 'growing' : beta1 < -0.2 ? 'declining' : 'stable';
        return {
            historicalWeeks: weekPoints,
            forecast,
            confidenceInterval: {
                low: Math.max(0, forecast - margin),
                high: forecast + margin,
            },
            trend,
            trendSlope: round1(beta1),
            rSquared: ssXX > 0
                ? round1(1 - sse / (ys.reduce((acc, y) => acc + (y - yMean) ** 2, 0) || 1))
                : 0,
            modelFormula: `ŷ = ${round1(beta0)} + ${round1(beta1)}·x  (OLS, R²=${round1(ssXX > 0 ? 1 - sse / (ys.reduce((acc, y) => acc + (y - yMean) ** 2, 0) || 1) : 0)})`,
        };
    }
    async getFocusDepth(userId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sessions = await this.prisma.focusSession.findMany({
            where: { userId, phase: 'focus', completedAt: { gte: thirtyDaysAgo } },
            select: { durationMin: true, completedAt: true },
            orderBy: { completedAt: 'asc' },
        });
        const totalSessions = sessions.length;
        if (totalSessions === 0) {
            return {
                flowStateScore: 0,
                level: 'none',
                deepWorkIndex: 0,
                sessionConsistency: 0,
                avgSessionMin: 0,
                longestStreakDays: 0,
                peakHourBlock: null,
                hourBlocks: [],
                modelFormula: 'flowStateScore = 0.35·consistency + 0.30·depth + 0.20·rhythm + 0.15·peakAlignment',
                insights: ['Нет данных о фокус-сессиях за 30 дней'],
            };
        }
        const totalMin = sessions.reduce((acc, s) => acc + s.durationMin, 0);
        const avgDuration = totalMin / totalSessions;
        const hourCounts = new Array(24).fill(0);
        sessions.forEach((s) => {
            const h = s.completedAt.getHours();
            hourCounts[h]++;
        });
        const blockLabels = [
            'Ночь 0-6',
            'Утро 6-12',
            'День 12-18',
            'Вечер 18-24',
        ];
        const blockKeys = ['night', 'morning', 'afternoon', 'evening'];
        const blockCounts = [
            hourCounts.slice(0, 6).reduce((a, b) => a + b, 0),
            hourCounts.slice(6, 12).reduce((a, b) => a + b, 0),
            hourCounts.slice(12, 18).reduce((a, b) => a + b, 0),
            hourCounts.slice(18, 24).reduce((a, b) => a + b, 0),
        ];
        const maxBlockIdx = blockCounts.indexOf(Math.max(...blockCounts));
        const peakHourBlock = blockKeys[maxBlockIdx];
        const hourBlocks = blockLabels.map((label, i) => ({
            label,
            key: blockKeys[i],
            count: blockCounts[i],
            isPeak: i === maxBlockIdx,
        }));
        const activeDays = new Set(sessions.map((s) => s.completedAt.toISOString().slice(0, 10))).size;
        const sessionConsistency = Math.min(activeDays / 20, 1);
        const avgDepthComponent = Math.min(avgDuration / 90, 1);
        const deepSessions = sessions.filter((s) => s.durationMin >= 45).length;
        const deepWorkIndex = Math.round((deepSessions / totalSessions) * 100);
        const dailyCounts = {};
        sessions.forEach((s) => {
            const day = s.completedAt.toISOString().slice(0, 10);
            dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
        });
        const dayVals = Object.values(dailyCounts);
        const mean = dayVals.reduce((a, b) => a + b, 0) / (dayVals.length || 1);
        const variance = dayVals.reduce((acc, v) => acc + (v - mean) ** 2, 0) /
            (dayVals.length || 1);
        const stdDev = Math.sqrt(variance);
        const rhythmScore = mean > 0 ? Math.max(0, 1 - stdDev / mean) : 0;
        const peakAlignment = blockCounts[maxBlockIdx] / totalSessions;
        const rawScore = 0.35 * sessionConsistency +
            0.3 * avgDepthComponent +
            0.2 * rhythmScore +
            0.15 * peakAlignment;
        const flowStateScore = Math.round(rawScore * 100);
        const level = flowStateScore >= 75
            ? 'deep-flow'
            : flowStateScore >= 50
                ? 'flow'
                : flowStateScore >= 25
                    ? 'shallow'
                    : 'distracted';
        const sortedDays = Object.keys(dailyCounts).sort();
        let longestStreakDays = 0;
        let currentStreak = 0;
        for (let i = 0; i < sortedDays.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            }
            else {
                const prev = new Date(sortedDays[i - 1]);
                const curr = new Date(sortedDays[i]);
                const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
                currentStreak = diff === 1 ? currentStreak + 1 : 1;
            }
            longestStreakDays = Math.max(longestStreakDays, currentStreak);
        }
        const insights = [];
        if (avgDuration >= 45) {
            insights.push(`Средняя сессия ${Math.round(avgDuration)} мин — вы работаете в зоне глубокого фокуса.`);
        }
        else {
            insights.push(`Средняя сессия всего ${Math.round(avgDuration)} мин. Попробуйте увеличить до 45+ для deep work.`);
        }
        if (sessionConsistency >= 0.6) {
            insights.push(`Высокая регулярность: фокус-сессии в ${activeDays} из 30 дней.`);
        }
        else {
            insights.push(`Низкая регулярность: фокус-сессии лишь в ${activeDays} из 30 дней.`);
        }
        if (rhythmScore >= 0.7) {
            insights.push('Стабильный ритм сессий — хороший признак когнитивной дисциплины.');
        }
        if (peakAlignment >= 0.6) {
            insights.push(`Большинство сессий в пиковое окно (${blockLabels[maxBlockIdx]}) — отличное выравнивание.`);
        }
        return {
            flowStateScore,
            level,
            deepWorkIndex,
            sessionConsistency: Math.round(sessionConsistency * 100),
            avgSessionMin: Math.round(avgDuration),
            longestStreakDays,
            peakHourBlock,
            hourBlocks,
            modelFormula: 'flowStateScore = 0.35·consistency + 0.30·depth + 0.20·rhythm + 0.15·peakAlignment',
            insights,
        };
    }
    async getHabitCorrelation(userId) {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const [habits, tasks] = await Promise.all([
            this.prisma.habit.findMany({
                where: { userId },
                select: { id: true, name: true, completedDays: true },
            }),
            this.prisma.task.findMany({
                where: {
                    userId,
                    status: client_1.TaskStatus.DONE,
                    completedAt: { gte: sixtyDaysAgo },
                },
                select: { completedAt: true },
            }),
        ]);
        const tasksByDay = {};
        tasks.forEach((t) => {
            if (!t.completedAt)
                return;
            const day = t.completedAt.toISOString().slice(0, 10);
            tasksByDay[day] = (tasksByDay[day] ?? 0) + 1;
        });
        const dates = [];
        for (let i = 59; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().slice(0, 10));
        }
        function pearson(xs, ys) {
            const n = xs.length;
            if (n < 3)
                return 0;
            const mx = xs.reduce((a, b) => a + b, 0) / n;
            const my = ys.reduce((a, b) => a + b, 0) / n;
            const num = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0);
            const den = Math.sqrt(xs.reduce((acc, x) => acc + (x - mx) ** 2, 0) *
                ys.reduce((acc, y) => acc + (y - my) ** 2, 0));
            return den === 0 ? 0 : num / den;
        }
        const correlations = [];
        for (const habit of habits) {
            const completedSet = new Set(habit.completedDays);
            const xs = [];
            const ys = [];
            for (let i = 0; i < dates.length - 1; i++) {
                const habitDone = completedSet.has(dates[i]) ? 1 : 0;
                const nextDayTasks = tasksByDay[dates[i + 1]] ?? 0;
                xs.push(habitDone);
                ys.push(nextDayTasks);
            }
            const activeDays = xs.filter((x) => x === 1).length;
            if (activeDays < 8)
                continue;
            const r = pearson(xs, ys);
            const rRounded = Math.round(r * 100) / 100;
            const direction = r > 0.15 ? 'positive' : r < -0.15 ? 'negative' : 'neutral';
            const interpretation = direction === 'positive'
                ? `Выполнение «${habit.name}» ассоциировано с ростом продуктивности на следующий день (+${Math.round(r * 100)}%).`
                : direction === 'negative'
                    ? `«${habit.name}» негативно коррелирует с задачами следующего дня. Возможно, она отнимает когнитивный ресурс.`
                    : `«${habit.name}» не показывает значимой связи с продуктивностью.`;
            correlations.push({
                habitId: habit.id,
                habitName: habit.name,
                r: rRounded,
                direction,
                activeDays,
                interpretation,
            });
        }
        correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        const topPositive = correlations.filter((c) => c.direction === 'positive')[0] ?? null;
        const summary = correlations.length === 0
            ? 'Недостаточно данных для корреляционного анализа (нужно ≥ 8 дней выполнения каждой привычки).'
            : topPositive
                ? `Самый сильный предиктор продуктивности: «${topPositive.habitName}» (r = ${topPositive.r}). Приоритизируйте её.`
                : 'Значимых позитивных предикторов не обнаружено — попробуйте практиковать привычки регулярнее.';
        return {
            correlations,
            summary,
            modelFormula: 'r = Σ(Xi−X̄)(Yi+1−Ȳ) / √[Σ(Xi−X̄)²·Σ(Yi+1−Ȳ)²]  (Pearson, lag-1)',
            dataWindowDays: 60,
        };
    }
    async getScenarioSimulator(userId) {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 42);
        start.setHours(0, 0, 0, 0);
        const [tasks, sessions, habits] = await Promise.all([
            this.prisma.task.findMany({
                where: {
                    userId,
                    status: client_1.TaskStatus.DONE,
                    completedAt: { gte: start },
                },
                select: { completedAt: true },
            }),
            this.prisma.focusSession.findMany({
                where: {
                    userId,
                    phase: 'focus',
                    completedAt: { gte: start },
                },
                select: { completedAt: true, durationMin: true },
            }),
            this.prisma.habit.findMany({
                where: { userId },
                select: { completedDays: true },
            }),
        ]);
        const dayKeys = [];
        for (let i = 41; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            dayKeys.push(d.toISOString().slice(0, 10));
        }
        const tasksByDay = {};
        tasks.forEach((t) => {
            if (!t.completedAt)
                return;
            const day = t.completedAt.toISOString().slice(0, 10);
            tasksByDay[day] = (tasksByDay[day] ?? 0) + 1;
        });
        const focusByDay = {};
        sessions.forEach((s) => {
            const day = s.completedAt.toISOString().slice(0, 10);
            focusByDay[day] = (focusByDay[day] ?? 0) + s.durationMin;
        });
        const habitByDay = {};
        habits.forEach((h) => {
            if (!Array.isArray(h.completedDays))
                return;
            h.completedDays.forEach((raw) => {
                if (typeof raw !== 'string')
                    return;
                if (!dayKeys.includes(raw))
                    return;
                habitByDay[raw] = (habitByDay[raw] ?? 0) + 1;
            });
        });
        const y = dayKeys.map((d) => tasksByDay[d] ?? 0);
        const xf = dayKeys.map((d) => focusByDay[d] ?? 0);
        const xh = dayKeys.map((d) => habitByDay[d] ?? 0);
        const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const variance = (arr) => {
            const m = avg(arr);
            return arr.length
                ? arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / arr.length
                : 0;
        };
        const covariance = (a, b) => {
            const ma = avg(a);
            const mb = avg(b);
            if (!a.length || a.length !== b.length)
                return 0;
            return (a.reduce((acc, v, i) => acc + (v - ma) * (b[i] - mb), 0) / a.length);
        };
        const focusVar = variance(xf);
        const habitVar = variance(xh);
        const betaFocus = Math.max(0, focusVar > 0 ? covariance(xf, y) / focusVar : 0);
        const betaHabit = Math.max(0, habitVar > 0 ? covariance(xh, y) / habitVar : 0);
        const recentDays = dayKeys.slice(-14);
        const baselineWeekly = Math.max(0, Math.round(recentDays.reduce((acc, d) => acc + (tasksByDay[d] ?? 0), 0) / 2));
        const scenariosInput = [
            {
                key: 'focus-sprint',
                title: 'Focus Sprint',
                focusDeltaMinPerDay: 30,
                habitDeltaPerDay: 0,
            },
            {
                key: 'habit-discipline',
                title: 'Habit Discipline',
                focusDeltaMinPerDay: 0,
                habitDeltaPerDay: 1,
            },
            {
                key: 'hybrid-excellence',
                title: 'Hybrid Excellence',
                focusDeltaMinPerDay: 20,
                habitDeltaPerDay: 1,
            },
        ];
        const scenarios = scenariosInput.map((s) => {
            const deltaPerDay = betaFocus * s.focusDeltaMinPerDay + betaHabit * s.habitDeltaPerDay;
            const deltaWeekly = Math.round(deltaPerDay * 7);
            const projectedWeekly = Math.max(0, baselineWeekly + deltaWeekly);
            const upliftPercent = baselineWeekly > 0
                ? Math.round((deltaWeekly / baselineWeekly) * 100)
                : deltaWeekly > 0
                    ? 100
                    : 0;
            return {
                key: s.key,
                title: s.title,
                projectedCompletedTasksWeekly: projectedWeekly,
                upliftPercent,
                assumptions: [
                    `+${s.focusDeltaMinPerDay} мин фокуса в день`,
                    `+${s.habitDeltaPerDay} привычек в день`,
                ],
            };
        });
        scenarios.sort((a, b) => b.projectedCompletedTasksWeekly - a.projectedCompletedTasksWeekly);
        const bestScenario = scenarios[0];
        const MIN_DAYS_FOR_MEDIUM_CONFIDENCE = 35;
        const confidence = dayKeys.length >= MIN_DAYS_FOR_MEDIUM_CONFIDENCE ? 'medium' : 'low';
        return {
            baseline: {
                completedTasksWeekly: baselineWeekly,
                avgFocusMinPerDay: Math.round(avg(xf)),
                avgHabitCompletionsPerDay: round1(avg(xh)),
            },
            scenarios,
            bestScenarioKey: bestScenario?.key ?? null,
            confidence,
            modelFormula: 'ŷ_day = α + βf·focusMin + βh·habitCompletions;  βf=cov(focus,tasks)/var(focus), βh=cov(habits,tasks)/var(habits)',
            explanation: 'Симулятор оценивает эффект поведенческих изменений на недельную продуктивность по персональным данным последних 42 дней.',
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_service_1.EventsService])
], AnalyticsService);
function round1(value) {
    return Math.round(value * 10) / 10;
}
//# sourceMappingURL=analytics.service.js.map