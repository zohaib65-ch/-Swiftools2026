import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserService } from '../../user/user.service';

@Injectable()
export class UsageGuard implements CanActivate {
  constructor(private userService: UserService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Populated by JwtAuthGuard

    if (!user || !user.userId) {
      return false;
    }

    const dbUser: any = await this.userService.user({ id: user.userId });

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    // Admins and Pro users bypass limits
    if (dbUser.role === 'ADMIN' || dbUser.plan === 'PRO') {
      return true;
    }

    if (dbUser.credits <= 0) {
      throw new ForbiddenException('Insufficient credits. Please upgrade your plan.');
    }

    return true;
  }
}
