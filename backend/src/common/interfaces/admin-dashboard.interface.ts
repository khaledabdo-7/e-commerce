import { OrderStatus, PaymentStatus } from '../enum/order.enum.js';

export interface IAdminDashboard {
  range: { from?: Date; to?: Date };
  sales: { revenue: number; paidOrders: number };
  orders: { total: number; byStatus: Partial<Record<OrderStatus, number>> };
  users: { total: number; newInRange: number };
  products: { total: number };
  inventory: { unitsInStock: number; lowStockProducts: number };
  payments: { byStatus: Partial<Record<PaymentStatus, number>> };
}
