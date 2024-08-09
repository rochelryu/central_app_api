import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { jwtConstants } from 'src/Constants/auth';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class UserGuard implements CanActivate {
  private logger: Logger = new Logger('UserGuard');
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, jwtConstants);
      this.logger.debug(payload);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['userGuard'] = payload;
      const userGuard = payload as { sub: string; email: string };

      const _id = userGuard.sub ?? '';
      const user = await this.userModel.findOne({ _id }).exec();
      if (!user) {
        throw new HttpException('Not User Found', HttpStatus.NOT_FOUND);
      }
      request['userEntity'] = user;
      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
