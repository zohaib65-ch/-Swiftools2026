import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.user({ email });
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        credits: user.credits,
      }
    };
  }

  async register(data: any) {
    const existingUser = await this.userService.user({ email: data.email });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userService.createUser({
      ...data,
      password: hashedPassword,
    });
    return this.login(user);
  }

  async loginWithGoogle(data: { email: string; name: string; photo?: string }) {
    let user = await this.userService.user({ email: data.email });

    if (!user) {
      // Create new user with random password
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.userService.createUser({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        // photo: data.photo, // If schema supports it
      });
    }

    return this.login(user); // Issue JWT
  }

  async getUserProfile(userId: string) {
    const user = await this.userService.user({ id: userId });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }
}
