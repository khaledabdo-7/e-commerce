import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto.js';
import { PaymentService } from './payment.service.js';

type AuthenticatedRequest = Request & {
  user: { _id: { toString(): string } };
};

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('paymob/session')
  @UseGuards(AuthGuard, OrderUserGuard)
  createSession(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePaymentSessionDto,
  ) {
    return this.paymentService.createSession(
      request.user._id.toString(),
      dto.orderId,
    );
  }

  @Post('paymob/webhook')
  webhook(
    @Body() body: unknown,
    @Query() query: Record<string, unknown>,
  ) {
    const payload = this.asRecord(body);
    const hmac =
      this.stringValue(query.hmac) || this.stringValue(payload.hmac);
    return this.paymentService.handleCallback(payload, hmac);
  }

  @Get('paymob/callback')
  callback(@Query() query: Record<string, unknown>) {
    const hmac = this.stringValue(query.hmac);
    return this.paymentService.handleCallback(query, hmac);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value : '';
  }
}
