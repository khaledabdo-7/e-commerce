import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderGuard } from '../../common/guards/order-admin.guard.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';

@Controller('admin/dashboard')
@UseGuards(AuthGuard, OrderGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  getStats(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getStats(query);
  }
}
