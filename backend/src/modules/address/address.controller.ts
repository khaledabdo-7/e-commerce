import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { AddressService } from './address.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

type AuthenticatedRequest = Request & {
  user: { _id: { toString(): string } };
};

@Controller('addresses')
@UseGuards(AuthGuard, OrderUserGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressService.create(request.user._id.toString(), dto);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.addressService.list(request.user._id.toString());
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(
      request.user._id.toString(),
      id,
      dto,
    );
  }

  @Patch(':id/default')
  setDefault(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.addressService.setDefault(request.user._id.toString(), id);
  }

  @Delete(':id')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.addressService.remove(request.user._id.toString(), id);
  }
}
