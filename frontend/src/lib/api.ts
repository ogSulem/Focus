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
          title: 'Закрыть блокер по дипломному модулю аналитики',
          score: 92,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          deadline: new Date(Date.now() + 86_400_000).toISOString(),
          recommendedWindow: 'morning',
          reasons: ['высокий приоритет', 'дедлайн в ближайшие 24 часа'],
        },
        {
          id: 'demo-plan-2',
          title: 'Подготовить визуализации для защиты',
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
};

export async function getDashboardData(token?: string): Promise<DashboardData> {
  if (!token) {
    return DEMO_DATA;
  }

  try {
    const [tasks, habits, weekly, recommendations, intelligence, experimentReport, user] =
      await Promise.all([
      apiFetch<Task[]>('/tasks', token),
      apiFetch<Habit[]>('/habits', token),
      apiFetch<ProductivityPoint[]>('/analytics/weekly', token),
      apiFetch<RecommendationPayload>('/analytics/recommendations', token),
      apiFetch<IntelligencePayload>('/analytics/intelligence?energy=medium', token),
      apiFetch<ExperimentReport>('/analytics/experiment-report', token),
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
      user: user ?? undefined,
    };
  } catch {
    return DEMO_DATA;
  }
}
