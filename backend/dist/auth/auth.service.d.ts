import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            plan: any;
            credits: any;
        };
    }>;
    register(data: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            plan: any;
            credits: any;
        };
    }>;
    loginWithGoogle(data: {
        email: string;
        name: string;
        photo?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            plan: any;
            credits: any;
        };
    }>;
    getUserProfile(userId: string): Promise<any>;
}
