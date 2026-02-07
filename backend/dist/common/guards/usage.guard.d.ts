import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UserService } from '../../user/user.service';
export declare class UsageGuard implements CanActivate {
    private userService;
    constructor(userService: UserService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
