export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  deadline?: string | null;
  createdAt: string;
  tags?: string[];
  subtasks?: Subtask[];
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDays: string[];
}

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
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
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

export interface ExperimentMetrics {
  completedTasks: number;
  completionRate: number;
  overdueOpenTasks: number;
  habitCompletions: number;
  focusMinutes: number;
}

export interface ExperimentReport {
  before: ExperimentMetrics;
  after: ExperimentMetrics;
  delta: ExperimentMetrics;
}

export interface BurnoutIndexPayload {
  burnoutIndex: number; // 0–100, higher = more burnout risk
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  suggestions: string[];
  modelFormula: string;
}

export type ArchetypeType =
  | 'MORNING_PEAK'
  | 'DEADLINE_DRIVEN'
  | 'DEEP_WORK_FOCUSED'
  | 'HABIT_BUILDER'
  | 'BALANCED'
  | 'UNKNOWN';

export interface ArchetypePayload {
  archetype: ArchetypeType;
  label: string;
  description: string;
  confidence: number; // 0–100
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
  historicalWeeks: { weekLabel: string; completed: number }[];
  forecast: number;
  confidenceInterval: { low: number; high: number };
  trend: 'growing' | 'declining' | 'stable';
  trendSlope: number;
  rSquared: number;
  modelFormula: string;
}

export interface FocusDepthPayload {
  flowStateScore: number; // 0–100
  level: 'none' | 'distracted' | 'shallow' | 'flow' | 'deep-flow';
  deepWorkIndex: number; // % sessions ≥ 45 min
  sessionConsistency: number; // % days active
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
  r: number; // Pearson, –1..1
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

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  mode: 'live' | 'demo';
  tasks: Task[];
  habits: Habit[];
  weekly: ProductivityPoint[];
  recommendations: RecommendationPayload;
  intelligence: IntelligencePayload;
  experimentReport: ExperimentReport;
  burnout: BurnoutIndexPayload;
  archetype: ArchetypePayload;
  velocityForecast: VelocityForecastPayload;
  focusDepth: FocusDepthPayload;
  habitCorrelation: HabitCorrelationPayload;
  scenarioSimulator: ScenarioSimulatorPayload;
  user?: UserProfile;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// In Docker, SSR requests should go via internal network to avoid going through
// the public-facing port. INTERNAL_API_URL is set in docker-compose for the backend service.
const SERVER_API_URL =
  typeof window === 'undefined'
    ? (process.env.INTERNAL_API_URL ?? API_URL)
    : API_URL;

async function apiFetch<T>(path: string, token?: string): Promise<T> {
  const baseUrl = typeof window === 'undefined' ? SERVER_API_URL : API_URL;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

const DEMO_DATA: DashboardData = {
  mode: 'demo',
  tasks: [
    {
      id: 't1',
      title: 'Подготовить отчёт по продуктивности Q1',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 2 * 86_400_000).toISOString(),
      tags: ['работа', 'отчёт'],
      subtasks: [
        { id: 's1', title: 'Собрать данные', done: true },
        { id: 's2', title: 'Написать аналитику', done: true },
        { id: 's3', title: 'Оформить презентацию', done: false },
        { id: 's4', title: 'Проверить с командой', done: false },
      ],
    },
    {
      id: 't2',
      title: 'Разобрать входящие задачи',
      priority: 'MEDIUM',
      status: 'DONE',
      createdAt: new Date().toISOString(),
      tags: ['inbox'],
      subtasks: [],
    },
    {
      id: 't3',
      title: 'Встреча с командой по новому спринту',
      priority: 'HIGH',
      status: 'TODO',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 86_400_000).toISOString(),
      tags: ['встреча', 'спринт'],
      subtasks: [
        { id: 's5', title: 'Подготовить повестку', done: false },
        { id: 's6', title: 'Отправить приглашение', done: false },
      ],
    },
    {
      id: 't4',
      title: 'Обновить документацию API',
      priority: 'LOW',
      status: 'TODO',
      createdAt: new Date().toISOString(),
      tags: ['dev', 'документация'],
      subtasks: [],
    },
    {
      id: 't5',
      title: 'Провести code review PR #42',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      tags: ['dev', 'review'],
      subtasks: [
        { id: 's7', title: 'Проверить логику', done: true },
        { id: 's8', title: 'Оставить комментарии', done: false },
      ],
    },
  ],
  habits: [
    {
      id: 'h1',
      name: 'Deep Work 2h',
      streak: 6,
      completedDays: Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return i % 3 !== 0 ? d.toISOString().slice(0, 10) : '';
      }).filter(Boolean),
    },
    {
      id: 'h2',
      name: 'Планирование дня',
      streak: 11,
      completedDays: Array.from({ length: 21 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return i % 5 !== 0 ? d.toISOString().slice(0, 10) : '';
      }).filter(Boolean),
    },
    {
      id: 'h3',
      name: 'Чтение 30 минут',
      streak: 3,
      completedDays: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return i < 4 ? d.toISOString().slice(0, 10) : '';
      }).filter(Boolean),
    },
  ],
  weekly: [
    { date: 'Пн', completedTasksCount: 2, totalTasksCount: 4 },
    { date: 'Вт', completedTasksCount: 3, totalTasksCount: 5 },
    { date: 'Ср', completedTasksCount: 5, totalTasksCount: 6 },
    { date: 'Чт', completedTasksCount: 3, totalTasksCount: 7 },
    { date: 'Пт', completedTasksCount: 6, totalTasksCount: 8 },
    { date: 'Сб', completedTasksCount: 2, totalTasksCount: 3 },
    { date: 'Вс', completedTasksCount: 1, totalTasksCount: 2 },
  ],
  recommendations: {
    recommendations: [
      '🌅 Лучшее окно фокуса: утро 9–12. Планируйте самые сложные задачи в это время.',
      '📉 Вечером активность падает — переносите рутинные и административные задачи на после 17:00.',
      '⏱ Работайте блоками 50/10: 50 минут фокус + 10 минут отдых. Это даст +40% продуктивности.',
    ],
  },
  intelligence: {
    adaptivePlanning: {
      energyLevel: 'medium',
      prioritizedTasks: [
        {
          id: 'demo-plan-1',
          title: 'Закрыть блокер по модулю аналитики',
          score: 92,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          recommendedWindow: 'morning',
          reasons: ['высокий приоритет', 'дедлайн в ближайшие 24 часа'],
        },
        {
          id: 'demo-plan-2',
          title: 'Подготовить релизные визуализации KPI',
          score: 84,
          priority: 'HIGH',
          status: 'TODO',
          deadline: new Date(Date.now() + 2 * 86_400_000).toISOString(),
          recommendedWindow: 'afternoon',
          reasons: ['дедлайн в ближайшие 3 дня', 'соответствует энергии'],
        },
      ],
    },
    predictions: {
      deadlineRisk: [
        {
          id: 'demo-risk-1',
          title: 'Документация API',
          riskPercent: 78,
          factors: ['долго в бэклоге', 'короткое окно до дедлайна'],
        },
      ],
      habitSuccess: [
        {
          id: 'demo-habit-1',
          name: 'Планирование дня',
          probability7dPercent: 87,
          confidence: 'high',
        },
      ],
    },
    recommendations: [
      {
        title: 'Сфокусируйтесь на утреннем deep-work окне',
        description: 'Выносите стратегические задачи на 09:00–12:00 для роста completion rate.',
        score: 89,
        reason: 'Исторический пик выполнения в утренние часы.',
      },
    ],
    modelMeta: {
      planningFormula:
        'score = deadlinePressure + priority + waitingTime + energyFit + focusFit',
      predictionFormula:
        'risk = overdueSignal + deadlineDistance + backlogLoad - executionVelocity',
      explainability: 'Каждый вывод содержит факторы влияния.',
    },
  },
  experimentReport: {
    before: {
      completedTasks: 12,
      completionRate: 54,
      overdueOpenTasks: 6,
      habitCompletions: 13,
      focusMinutes: 290,
    },
    after: {
      completedTasks: 19,
      completionRate: 73,
      overdueOpenTasks: 3,
      habitCompletions: 22,
      focusMinutes: 470,
    },
    delta: {
      completedTasks: 7,
      completionRate: 19,
      overdueOpenTasks: -3,
      habitCompletions: 9,
      focusMinutes: 180,
    },
  },
  burnout: {
    burnoutIndex: 38,
    level: 'medium',
    factors: [
      '4 просроченных задачи в работе',
      'LOW темп завершений за последние 7 дней',
    ],
    suggestions: [
      'Переведите часть просроченных задач в архив или перенесите дедлайны',
      'Начните с одной «быстрой победой» каждое утро',
    ],
    modelFormula:
      'burnoutIndex = 0.30·overduePressure + 0.25·backlogDensity + 0.20·habitGap - 0.15·focusConsistency - 0.10·completionMomentum',
  },
  archetype: {
    archetype: 'MORNING_PEAK',
    label: 'Утренний пик',
    description:
      'Максимальная продуктивность в ранние часы. Стратегические задачи лучше решаются до полудня.',
    confidence: 74,
    traits: ['Активен 5–12 ч', 'Быстрый старт рабочего дня', 'Энергия падает к вечеру'],
    rawScores: { morningPeak: 74, deadlineDriven: 31, deepWork: 55, habitBuilder: 48 },
    peakWindow: '05:00–12:00',
  },
  velocityForecast: {
    historicalWeeks: [
      { weekLabel: '2026-03-17', completed: 8 },
      { weekLabel: '2026-03-24', completed: 11 },
      { weekLabel: '2026-03-31', completed: 9 },
      { weekLabel: '2026-04-07', completed: 13 },
      { weekLabel: '2026-04-14', completed: 14 },
      { weekLabel: '2026-04-21', completed: 16 },
      { weekLabel: '2026-04-28', completed: 15 },
      { weekLabel: '2026-05-05', completed: 18 },
    ],
    forecast: 20,
    confidenceInterval: { low: 16, high: 24 },
    trend: 'growing',
    trendSlope: 1.3,
    rSquared: 0.87,
    modelFormula: 'ŷ = 7.5 + 1.3·x  (OLS, R²=0.87)',
  },
  focusDepth: {
    flowStateScore: 67,
    level: 'flow',
    deepWorkIndex: 58,
    sessionConsistency: 70,
    avgSessionMin: 42,
    longestStreakDays: 8,
    peakHourBlock: 'morning',
    hourBlocks: [
      { label: 'Ночь 0-6',  key: 'night',     count: 1,  isPeak: false },
      { label: 'Утро 6-12', key: 'morning',   count: 14, isPeak: true  },
      { label: 'День 12-18',key: 'afternoon', count: 8,  isPeak: false },
      { label: 'Вечер 18-24',key: 'evening',  count: 5,  isPeak: false },
    ],
    modelFormula: 'flowStateScore = 0.35·consistency + 0.30·depth + 0.20·rhythm + 0.15·peakAlignment',
    insights: [
      'Средняя сессия 42 мин — вы работаете в зоне глубокого фокуса.',
      'Высокая регулярность: фокус-сессии в 21 из 30 дней.',
      'Большинство сессий утром (6–12 ч) — отличное выравнивание с пиком энергии.',
    ],
  },
  habitCorrelation: {
    correlations: [
      {
        habitId: 'demo-h1',
        habitName: 'Deep Work 2h',
        r: 0.52,
        direction: 'positive',
        activeDays: 14,
        interpretation:
          'Выполнение «Deep Work 2h» ассоциировано с ростом продуктивности на следующий день (+52%).',
      },
      {
        habitId: 'demo-h2',
        habitName: 'Планирование дня',
        r: 0.38,
        direction: 'positive',
        activeDays: 18,
        interpretation:
          'Выполнение «Планирование дня» ассоциировано с ростом продуктивности на следующий день (+38%).',
      },
      {
        habitId: 'demo-h3',
        habitName: 'Чтение 30 минут',
        r: 0.11,
        direction: 'neutral',
        activeDays: 9,
        interpretation: '«Чтение 30 минут» не показывает значимой связи с продуктивностью.',
      },
    ],
    summary:
      'Самый сильный предиктор продуктивности: «Deep Work 2h» (r = 0.52). Приоритизируйте её.',
    modelFormula: 'r = Σ(Xi−X̄)(Yi+1−Ȳ) / √[Σ(Xi−X̄)²·Σ(Yi+1−Ȳ)²]  (Pearson, lag-1)',
    dataWindowDays: 60,
  },
  scenarioSimulator: {
    baseline: {
      completedTasksWeekly: 14,
      avgFocusMinPerDay: 51,
      avgHabitCompletionsPerDay: 1.4,
    },
    scenarios: [
      {
        key: 'focus-sprint',
        title: 'Focus Sprint',
        projectedCompletedTasksWeekly: 17,
        upliftPercent: 21,
        assumptions: ['+30 мин фокуса в день', '+0 привычек в день'],
      },
      {
        key: 'habit-discipline',
        title: 'Habit Discipline',
        projectedCompletedTasksWeekly: 16,
        upliftPercent: 14,
        assumptions: ['+0 мин фокуса в день', '+1 привычка в день'],
      },
      {
        key: 'hybrid-excellence',
        title: 'Hybrid Excellence',
        projectedCompletedTasksWeekly: 19,
        upliftPercent: 36,
        assumptions: ['+20 мин фокуса в день', '+1 привычка в день'],
      },
    ],
    bestScenarioKey: 'hybrid-excellence',
    confidence: 'medium',
    modelFormula:
      'ŷ_day = α + βf·focusMin + βh·habitCompletions;  βf=cov(focus,tasks)/var(focus), βh=cov(habits,tasks)/var(habits)',
    explanation:
      'Симулятор оценивает эффект изменений поведения на недельную продуктивность по персональным данным.',
  },
};

export async function getDashboardData(token?: string): Promise<DashboardData> {
  if (!token) {
    return DEMO_DATA;
  }

  try {
    const [tasks, habits, weekly, recommendations, intelligence, experimentReport, burnout, archetype, velocityForecast, focusDepth, habitCorrelation, scenarioSimulator, user] =
      await Promise.all([
        apiFetch<Task[]>('/tasks', token),
        apiFetch<Habit[]>('/habits', token),
        apiFetch<ProductivityPoint[]>('/analytics/weekly', token),
        apiFetch<RecommendationPayload>('/analytics/recommendations', token),
        apiFetch<IntelligencePayload>('/analytics/intelligence?energy=medium', token),
        apiFetch<ExperimentReport>('/analytics/experiment-report', token),
        apiFetch<BurnoutIndexPayload>('/analytics/burnout-index', token),
        apiFetch<ArchetypePayload>('/analytics/archetype', token),
        apiFetch<VelocityForecastPayload>('/analytics/velocity-forecast', token),
        apiFetch<FocusDepthPayload>('/analytics/focus-depth', token),
        apiFetch<HabitCorrelationPayload>('/analytics/habit-correlation', token),
        apiFetch<ScenarioSimulatorPayload>('/analytics/scenario-simulator', token),
        apiFetch<UserProfile>('/users/me', token).catch(() => null),
      ]);

    return {
      mode: 'live',
      tasks,
      habits: habits.map((habit) => ({
        ...habit,
        completedDays: Array.isArray(habit.completedDays)
          ? habit.completedDays.filter((day): day is string => typeof day === 'string')
          : [],
      })),
      weekly,
      recommendations,
      intelligence,
      experimentReport,
      burnout,
      archetype,
      velocityForecast,
      focusDepth,
      habitCorrelation,
      scenarioSimulator,
      user: user ?? undefined,
    };
  } catch {
    return DEMO_DATA;
  }
}
