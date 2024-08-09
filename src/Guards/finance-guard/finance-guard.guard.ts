import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FinanceAccount } from 'src/finance/entities/finance.entity';

@Injectable()
export class FinanceGuardGuard implements CanActivate {
  private logger: Logger = new Logger('UserGuard');
  constructor(
    @InjectModel(FinanceAccount.name)
    private readonly financeAccountModel: Model<FinanceAccount>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { clientId, clientSecret } = this.extractTokenFromHeader(request);
    if (!clientId || !clientSecret) {
      throw new UnauthorizedException();
    }
    try {
      const financeAccount = await this.financeAccountModel
        .findOne({ clientId, clientSecret })
        .exec();
      if (!financeAccount) {
        throw new HttpException(
          'Not Finance Account Found',
          HttpStatus.NOT_FOUND,
        );
      }
      request['financeAccount'] = financeAccount;
      return true;
    } catch (error) {
      this.logger.error(error.message);
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request) {
    const { 'x-app-token': clientSecret, 'x-app-access': clientId } =
      request.headers;
    return { clientId, clientSecret };
  }
}
