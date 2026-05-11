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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_service_1.EventsService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map