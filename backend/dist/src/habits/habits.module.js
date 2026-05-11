"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitsModule = void 0;
const common_1 = require("@nestjs/common");
const habits_service_1 = require("./habits.service");
const habits_controller_1 = require("./habits.controller");
const events_module_1 = require("../events/events.module");
let HabitsModule = class HabitsModule {
};
exports.HabitsModule = HabitsModule;
exports.HabitsModule = HabitsModule = __decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        providers: [habits_service_1.HabitsService],
        controllers: [habits_controller_1.HabitsController],
    })
], HabitsModule);
//# sourceMappingURL=habits.module.js.map