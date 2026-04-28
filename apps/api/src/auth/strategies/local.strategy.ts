import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private auth: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(req: any, email: string, password: string) {
    const user = await this.auth.validateUser(req.body.tenant, email, password);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
