import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAdminDashboard } from '../../common/interfaces/admin-dashboard.interface.js';
import { OrderModel } from '../../database/Model/order.model.js';
import { Product } from '../../database/Model/product.model.js';
import { User } from '../../database/Model/user.model.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';

interface CountRow {
  _id: string;
  count: number;
}

interface RevenueRow {
  _id: null;
  revenue: number;
  paidOrders: number;
}

interface InventoryRow {
  _id: null;
  unitsInStock: number;
  lowStockProducts: number;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(OrderModel.name)
    private readonly orderModel: Model<OrderModel>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getStats(query: DashboardQueryDto): Promise<IAdminDashboard> {
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException('The from date must precede the to date');
    }
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = query.from;
    if (query.to) createdAt.$lte = query.to;
    const rangeFilter = Object.keys(createdAt).length ? { createdAt } : {};
    const activeUserFilter = { deletedAt: null };
    const activeProductFilter = { deletedAt: null };

    const [
      revenueRows,
      orderTotal,
      orderStatuses,
      paymentStatuses,
      userTotal,
      newUsers,
      productTotal,
      inventoryRows,
    ] = await Promise.all([
      this.orderModel
        .aggregate<RevenueRow>([
          { $match: { ...rangeFilter, paymentStatus: 'paid' } },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$total' },
              paidOrders: { $sum: 1 },
            },
          },
        ])
        .exec(),
      this.orderModel.countDocuments(rangeFilter).exec(),
      this.orderModel
        .aggregate<CountRow>([
          { $match: rangeFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .exec(),
      this.orderModel
        .aggregate<CountRow>([
          { $match: rangeFilter },
          { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
        ])
        .exec(),
      this.userModel.countDocuments(activeUserFilter).exec(),
      this.userModel
        .countDocuments({
          ...activeUserFilter,
          ...(Object.keys(createdAt).length ? { createdAt } : {}),
        })
        .exec(),
      this.productModel.countDocuments(activeProductFilter).exec(),
      this.productModel
        .aggregate<InventoryRow>([
          { $match: activeProductFilter },
          {
            $group: {
              _id: null,
              unitsInStock: { $sum: '$stock' },
              lowStockProducts: {
                $sum: { $cond: [{ $lte: ['$stock', 5] }, 1, 0] },
              },
            },
          },
        ])
        .exec(),
    ]);

    const byStatus = Object.fromEntries(
      orderStatuses.map(({ _id, count }) => [_id, count]),
    ) as IAdminDashboard['orders']['byStatus'];
    const paymentByStatus = Object.fromEntries(
      paymentStatuses.map(({ _id, count }) => [_id, count]),
    ) as IAdminDashboard['payments']['byStatus'];

    return {
      range: { from: query.from, to: query.to },
      sales: {
        revenue: revenueRows[0]?.revenue ?? 0,
        paidOrders: revenueRows[0]?.paidOrders ?? 0,
      },
      orders: { total: orderTotal, byStatus },
      users: { total: userTotal, newInRange: newUsers },
      products: { total: productTotal },
      inventory: {
        unitsInStock: inventoryRows[0]?.unitsInStock ?? 0,
        lowStockProducts: inventoryRows[0]?.lowStockProducts ?? 0,
      },
      payments: { byStatus: paymentByStatus },
    };
  }
}
