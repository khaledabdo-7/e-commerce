
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../../database/Model/user.model.js';
import { UserRoleEnum } from '../enum/user.enum.js';

@Injectable()
export class OrderUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: User;
    }>();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (request.user.role !== UserRoleEnum.USER) {
      throw new ForbiddenException('User access required');
    }

    return true;
  }
}
