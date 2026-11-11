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
export class AuthGuard implements CanActivate {
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
    const token = parts.length > 1 ? parts[1] : parts[0];
    if (!token) {
      throw new UnauthorizedException('Invalid authorization');
    }

    let payload: any;
    for (const role of [UserRoleEnum.USER, UserRoleEnum.ADMIN]) {
      try {
        payload = await this.tokenService.verifyToken(token, role);
        if (payload) break;
      } catch {
        // جرّب اللي بعده
      }
    }
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userDoc = await this.userModel
      .findOne({ _id: payload.sub, deletedAt: null })
      .select('-password');

    if (!userDoc) {
      throw new UnauthorizedException('User not found');
    }

    request.user = userDoc;
    return true;
  }
}
