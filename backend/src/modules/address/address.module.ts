import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { TokenModule } from '../../common/services/token.module.js';
import { UserModel } from '../../database/Model/user.model.js';
import { AddressSchema } from '../../database/Model/address.model.js';
import { AddressController } from './address.controller.js';
import { AddressService } from './address.service.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: 'AddressModel', schema: AddressSchema },
      { name: 'User', schema: UserModel },
    ]),
  ],
  controllers: [AddressController],
  providers: [AddressService, AuthGuard, OrderUserGuard],
  exports: [AddressService],
})
export class AddressModule {}
