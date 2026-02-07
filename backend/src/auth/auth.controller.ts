import { Controller, Request, Post, UseGuards, Body, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() body) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body) {
    return this.authService.register(body);
  }

  @Post('google')
  async googleLogin(@Body() body: { email: string; name: string; photo?: string }) {
    return this.authService.loginWithGoogle(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    // req.user has { userId, email } from JwtStrategy
    const user = await this.authService.getUserProfile(req.user.userId);
    return user;
  }
}
