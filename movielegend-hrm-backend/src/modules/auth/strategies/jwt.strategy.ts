import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) config?: ConfigService) {
    const secret =
      config?.get<string>('jwt.accessSecret') ||
      process.env.JWT_ACCESS_SECRET ||
      'fallback_secret';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
        (req: any) => {
          let token = null;
          if (req && req.query && req.query.token) {
            token = req.query.token;
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: AuthenticatedUser): AuthenticatedUser {
    const accountantRoles = [
      'ACCOUNTANT',
      'ACCOUNTANT_LEAD',
      'ACCOUNTANT_PAYROLL',
      'ACCOUNTANT_TAX',
      'ACCOUNTANT_GENERAL',
      'ACCOUNTING',
      'ACC',
    ];
    if (payload.roles?.some((r) => accountantRoles.includes(r.toUpperCase()))) {
      if (!payload.permissions) payload.permissions = [];
      if (!payload.permissions.includes('employee.request.read')) {
        payload.permissions.push('employee.request.read');
      }
    }
    return payload;
  }
}
