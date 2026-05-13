# NeuroTrack — AI Productivity System

> Интеллектуальная система планирования и анализа продуктивности пользователя  
> **Дипломный проект · Next.js 16 + NestJS 11 + PostgreSQL + Docker**

---

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 16 · React 19 · Recharts |
| Backend | NestJS 11 · Prisma 6 · PostgreSQL 16 |
| Auth | JWT (access 15m + refresh 7d) · httpOnly cookies · bcrypt |
| Docs | Swagger / OpenAPI (`/api/docs`) |
| Security | Helmet · @nestjs/throttler (60 req/min) · CORS · cookie-parser |
| Infra | Docker · Docker Compose (db + backend + frontend) |

---

## 🐳 Быстрый старт через Docker (рекомендуется)

```bash
# 1. Скопировать и заполнить переменные окружения
cp .env.example .env          # заполнить JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 2. Запустить все сервисы (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api
# Swagger: http://localhost:3001/api/docs
```

Остановить: `docker-compose down` · Удалить данные: `docker-compose down -v`

---

## Быстрый старт (локально)

### Backend
```bash
cd backend
cp .env.example .env          # заполнить DATABASE_URL, JWT_*_SECRET
npm install
DATABASE_URL="postgresql://..." ./node_modules/.bin/prisma generate
DATABASE_URL="postgresql://..." ./node_modules/.bin/prisma migrate dev
npm run start:dev
# API: http://localhost:3001/api
# Swagger: http://localhost:3001/api/docs
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001/api npm run dev
# http://localhost:3000
# Demo-режим: без авторизации (богатые тестовые данные)
# Live-режим: после входа — токен хранится в httpOnly cookie
```

---

## Аутентификация

Реализована схема **access + refresh token** с хранением в httpOnly cookies:

| Cookie | TTL | Доступность |
|--------|-----|-------------|
| `nt_access` | 15 мин | httpOnly, Path=/ (читается SSR) |
| `nt_refresh` | 7 дней | httpOnly, Path=/api/auth (только для /auth/*) |

Поток:
1. `POST /api/auth/login` → backend возвращает `{accessToken}` + устанавливает `nt_refresh` httpOnly cookie
2. Фронтенд вызывает `POST /api/auth/set` → Next.js route handler устанавливает `nt_access` httpOnly cookie
3. SSR-страница читает `nt_access` из `cookies()` — **токен никогда не попадает в URL или JS-доступные переменные**
4. `POST /api/auth/refresh` → автоматическое обновление access token через nt_refresh cookie
5. `POST /api/auth/logout` → оба cookie удаляются, refresh token инвалидируется в БД

---

## API (Backend)

### Auth
| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/register | Регистрация + установка cookie |
| POST | /api/auth/login | Вход + установка cookie |
| POST | /api/auth/refresh | Обновление access token (cookie или body) |
| POST | /api/auth/logout | Выход (инвалидация refresh, очистка cookie) |

### Users
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/users/me | Профиль текущего пользователя |
| PATCH | /api/users/me | Обновить имя пользователя |
| GET | /api/users/me/stats | XP, уровень, достижения (геймификация) |

### Tasks
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/tasks | Все задачи (фильтр по status/priority/search) |
| GET | /api/tasks/stats | Статистика (по статусу, приоритету, overdue) |
| GET | /api/tasks/export?format=json\|csv | Экспорт задач (JSON или CSV) |
| GET | /api/tasks/:id | Получить одну задачу |
| POST | /api/tasks | Создать задачу |
| PUT | /api/tasks/:id | Обновить задачу |
| PATCH | /api/tasks/:id/status | Быстро сменить статус |
| POST | /api/tasks/:id/duplicate | Дублировать задачу |
| DELETE | /api/tasks/:id | Удалить задачу |

### Habits
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/habits | Все привычки |
| POST | /api/habits | Создать привычку |
| PUT | /api/habits/:id | Обновить привычку |
| PATCH | /api/habits/:id/track | Отметить как выполнено за день |
| PATCH | /api/habits/:id/untrack | Снять отметку за день |
| DELETE | /api/habits/:id | Удалить привычку |

### Analytics
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/analytics/weekly | Продуктивность за 7 дней |
| GET | /api/analytics/monthly | Продуктивность за 30 дней |
| GET | /api/analytics/summary | Полный аналитический дайджест |
| GET | /api/analytics/trends | Неделя-к-неделе сравнение |
| GET | /api/analytics/heatmap | GitHub-style годовая тепловая карта |
| GET | /api/analytics/recommendations | AI-рекомендации (rule-based) |
| GET | /api/analytics/intelligence?energy=low\|medium\|high | Адаптивное планирование + прогнозы рисков + explainable score |
| GET | /api/analytics/experiment-report | Before/after отчёт (7 дней vs предыдущие 7 дней) |

### Events / Audit
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/events?limit=40 | Таймлайн пользовательских событий (audit trail) |
| GET | /api/events/experiment-report | Метрики эксперимента для научной части |

### Telegram Bridge
| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/telegram/command | Команды бота: `/add <title>`, `/tasks` |

---

## Frontend — ключевые фичи

### 🎨 UI/UX
- **Светлая / тёмная тема** — мгновальное переключение без мерцания, сохраняется в localStorage
- **Glassmorphism карточки** — backdrop-blur, полупрозрачность, subtle glow
- **CSS animations** — slide-up, fade-in, scale-in, stagger, skeleton shimmer
- **Responsive design** — адаптивный сайдбар (hamburger на мобилках)
- **Ambient background blobs** — анимированные фоновые эффекты

### 📊 Дашборд
- **Stat Cards** — KPI-виджеты с glow orb и stagger-анимацией + sparkline
- **Area Chart** — gradient fill, кастомный tooltip (Recharts)
- **Donut Charts** — распределение по статусу и приоритету
- **Task Deadline Calendar** — месячный heat-calendar дедлайнов с плотностью нагрузки по дням
- **Activity Heatmap** — GitHub-style grid (18 недель) для каждой привычки
- **Yearly Heatmap** — полугодовая тепловая карта продуктивности
- **Weekly Trends** — неделя-к-неделе сравнение

### ⚡ Продуктивность
- **Focus Timer** — Pomodoro 25/5 с SVG ring-progress, счётчик сессий
- **Task Cards** — priority color bar, deadline badge, hover slide, inline edit
- **Habit Cards** — mini-calendar последних 7 дней, streak badge
- **Command Palette** — `⌘K` быстрый поиск задач и привычек
- **Quick Add** — горячая клавиша `N` для быстрого создания задачи

### 🎮 Геймификация
- **User Profile Widget** — аватар с инициалами, уровень, XP прогресс-бар
- **Achievements Card** — 10+ достижений с locked/unlocked визуалом
- **XP система** — начисляется за выполненные задачи и streak привычек
- **10 уровней** — от Новичка (L1) до Легенды (L10)

### 🔔 Уведомления
- **Notification Bell** — badge с просроченными задачами, dismiss per item
- **Toast system** — success/error/info уведомления с анимацией

### 🧠 Интеллектуальное ядро (новое)
- **Adaptive Planning Engine** — score-приоритизация задач с учетом дедлайна, важности, возраста задачи и текущей энергии пользователя
- **Risk Forecasting** — прогноз риска срыва дедлайна по каждой активной задаче с объяснением факторов
- **Habit Success Probability** — вероятность удержания привычек на 7 дней вперед + confidence level
- **Explainable Recommendations** — рекомендации возвращаются с числовым score и полем `reason` (почему совет выдан)
- **Event/Audit Layer** — событийный контур (`UserEvent`) фиксирует ключевые действия пользователя для аналитики и доказательной базы диплома

### 🧪 Научная ценность (новое)
- **Before/After метрики** по окну 14 дней (7 + 7): completed tasks, completion rate, overdue, habit completions, focus minutes
- **Экспериментальный блок на дашборде** с измеримым эффектом внедрения интеллектуального модуля
- **Формулы модели и explainability** показываются в UI (Intelligence card) на основе `modelMeta` для прозрачности и обоснования методики в ВКР
- **Diploma Compliance Matrix** — визуальный чеклист покрытия ключевых требований ТЗ/методических указаний прямо в интерфейсе

### ⚙️ Настройки
- **Profile Settings** — обновление имени пользователя
- **Data Export** — экспорт задач в JSON и CSV
- **Keyboard shortcuts** — полный список горячих клавиш
- **About** — информация о стеке

### 🔒 Безопасность
- **Optimistic UI** — мгновенное обновление, откат при ошибке с toast
- **Demo / Live режим** — fallback на богатые demo-данные без API
- **httpOnly cookies** — токены недоступны для JS

---

## Проверки качества

```bash
# Backend
cd backend && npm run lint && npm run build && npm test

# Frontend
cd frontend && npm run lint && npm run build
```

---

## Roadmap

- [ ] Redis refresh-token rotation + blacklist
- [ ] Real-time updates (WebSocket / SSE)
- [ ] Telegram bot webhook + привязка аккаунта
- [ ] RBAC, audit log, request tracing
- [ ] CI/CD pipeline (GitHub Actions → Docker Hub)
- [ ] Мобильное приложение (React Native / Expo)
