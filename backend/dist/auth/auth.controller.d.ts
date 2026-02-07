import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
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
    register(body: any): Promise<{
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
    googleLogin(body: {
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
    getProfile(req: any): Promise<any>;
}
