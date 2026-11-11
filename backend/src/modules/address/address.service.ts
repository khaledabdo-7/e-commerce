import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddressModel } from '../../database/Model/address.model.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(AddressModel.name)
    private readonly addressModel: Model<AddressModel>,
  ) {}

  async create(userId: string, dto: CreateAddressDto) {
    const address = await this.addressModel.create({
      label: dto.label,
      recipientName: dto.recipientName,
      phone: dto.phone,
      country: dto.country ?? 'Egypt',
      governorate: dto.governorate,
      city: dto.city,
      street: dto.street,
      building: dto.building,
      apartment: dto.apartment,
      postalCode: dto.postalCode,
      user: new Types.ObjectId(userId),
      isDefault: false,
    });
    if (!dto.isDefault) return address;

    await this.addressModel.updateMany(
      { user: address.user, _id: { $ne: address._id } },
      { $set: { isDefault: false } },
    );
    return this.setDefault(userId, address._id.toString());
  }

  list(userId: string) {
    return this.addressModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.findOwned(userId, id);
    if (dto.isDefault === true) {
      await this.addressModel.updateMany(
        { user: address.user, _id: { $ne: address._id } },
        { $set: { isDefault: false } },
      );
    }
    try {
      const updated = await this.addressModel
        .findOneAndUpdate(
          { _id: address._id, user: address.user },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .exec();
      if (!updated) throw new NotFoundException('Address not found');
      return updated;
    } catch (error) {
      this.throwDefaultConflict(error);
    }
  }

  async remove(userId: string, id: string) {
    const address = await this.addressModel
      .findOneAndDelete({
        _id: this.validId(id),
        user: new Types.ObjectId(userId),
      })
      .exec();
    if (!address) throw new NotFoundException('Address not found');
    return { deleted: true, id: address._id.toString() };
  }

  async setDefault(userId: string, id: string) {
    const address = await this.findOwned(userId, id);
    await this.addressModel.updateMany(
      { user: address.user, _id: { $ne: address._id } },
      { $set: { isDefault: false } },
    );
    try {
      const updated = await this.addressModel
        .findOneAndUpdate(
          { _id: address._id, user: address.user },
          { $set: { isDefault: true } },
          { new: true },
        )
        .exec();
      if (!updated) throw new NotFoundException('Address not found');
      return updated;
    } catch (error) {
      this.throwDefaultConflict(error);
    }
  }

  getOwned(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  private async findOwned(userId: string, id: string) {
    const address = await this.addressModel
      .findOne({ _id: this.validId(id), user: new Types.ObjectId(userId) })
      .exec();
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  private validId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Address not found');
    }
    return new Types.ObjectId(id);
  }

  private throwDefaultConflict(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('Only one default address is allowed');
    }
    throw error;
  }
}
