import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenService } from '../services/token.service.js';
import { User } from '../../database/Model/user.model.js';
import { UserRoleEnum } from '../enum/user.enum.js';

@Injectable()
export class ReviewGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const parts = authHeader.trim().split(/\s+/);
    let token: string | undefined;

    if (parts.length === 1) {
      token = parts[0];
    } else if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }

    if (!token) {
      throw new UnauthorizedException('Invalid authorization');
    }

    let payload: any;
    try {
      payload = await this.tokenService.decodeToken(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userDoc = await this.userModel
      .findOne({ _id: payload.sub, deletedAt: null })
      .select('+role');

    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }

    const role = userDoc.role;

    if (role !== UserRoleEnum.USER && role !== UserRoleEnum.ADMIN) {
      throw new UnauthorizedException('Invalid user role');
    }

    try {
      await this.tokenService.verifyToken(token, role);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = userDoc;

    return true;
  }
}
