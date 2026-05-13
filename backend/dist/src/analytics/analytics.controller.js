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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getOverview(user) {
        return this.analyticsService.getOverview(user.sub);
    }
    getWeekly(user) {
        return this.analyticsService.getWeekly(user.sub);
    }
    getMonthly(user) {
        return this.analyticsService.getMonthly(user.sub);
    }
    getSummary(user) {
        return this.analyticsService.getSummary(user.sub);
    }
    getRecommendations(user) {
        return this.analyticsService.getRecommendations(user.sub);
    }
    getIntelligence(user, energy) {
        return this.analyticsService.getIntelligence(user.sub, energy ?? 'medium');
    }
    getExperimentReport(user) {
        return this.analyticsService.getExperimentReport(user.sub);
    }
    getTrends(user) {
        return this.analyticsService.getTrends(user.sub);
    }
    getHeatmap(user) {
        return this.analyticsService.getHeatmap(user.sub);
    }
    getBurnoutIndex(user) {
        return this.analyticsService.getBurnoutIndex(user.sub);
    }
    getArchetype(user) {
        return this.analyticsService.getProductivityArchetype(user.sub);
    }
    getVelocityForecast(user) {
        return this.analyticsService.getVelocityForecast(user.sub);
    }
    getFocusDepth(user) {
        return this.analyticsService.getFocusDepth(user.sub);
    }
    getHabitCorrelation(user) {
        return this.analyticsService.getHabitCorrelation(user.sub);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({
        summary: 'Single-call analytics overview: summary + monthly + trends + time-of-day + week-by-day + score',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('weekly'),
    (0, swagger_1.ApiOperation)({ summary: 'Get weekly productivity chart data' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getWeekly", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Get monthly productivity chart data' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMonthly", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive analytics summary' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI-powered behaviour recommendations' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('intelligence'),
    (0, swagger_1.ApiOperation)({
        summary: 'Adaptive planning + risk forecasts + explainable score recommendations',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'energy',
        required: false,
        enum: ['low', 'medium', 'high'],
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('energy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getIntelligence", null);
__decorate([
    (0, common_1.Get)('experiment-report'),
    (0, swagger_1.ApiOperation)({
        summary: 'Scientific before/after report for the last 14 days (7 days vs previous 7 days)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getExperimentReport", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, swagger_1.ApiOperation)({ summary: 'Week-over-week trends comparison' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('heatmap'),
    (0, swagger_1.ApiOperation)({
        summary: 'Full-year GitHub-style activity heatmap (tasks + habits)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getHeatmap", null);
__decorate([
    (0, common_1.Get)('burnout-index'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cognitive load / burnout detection index (0–100) with factors and suggestions',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getBurnoutIndex", null);
__decorate([
    (0, common_1.Get)('archetype'),
    (0, swagger_1.ApiOperation)({
        summary: 'Classify user productivity archetype based on historical task and habit patterns',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getArchetype", null);
__decorate([
    (0, common_1.Get)('velocity-forecast'),
    (0, swagger_1.ApiOperation)({
        summary: 'OLS linear regression velocity forecast: predicted completed tasks for next week + confidence interval',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getVelocityForecast", null);
__decorate([
    (0, common_1.Get)('focus-depth'),
    (0, swagger_1.ApiOperation)({
        summary: 'Flow State & Deep Work Index: measures cognitive depth from focus session patterns (Csikszentmihalyi model)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getFocusDepth", null);
__decorate([
    (0, common_1.Get)('habit-correlation'),
    (0, swagger_1.ApiOperation)({
        summary: 'Pearson lag-1 correlation between each habit completion and next-day task output (60-day window)',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getHabitCorrelation", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map