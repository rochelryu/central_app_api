import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, map } from 'rxjs';
import { ReponseServiceGeneral } from 'src/Interfaces/ResponseInterface';

@Injectable()
export class TransformResultInJwtInterceptor implements NestInterceptor {
  private logger: Logger;
  constructor(private jwtService: JwtService) {
    this.logger = new Logger('TransformResultInJwtInterceptor');
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (response: ReponseServiceGeneral) => {
        if (response.result && response.result.client) {
          const { client } = response.result;
          const payload = {
            sub: client._id.toHexString(),
            email: client.email,
          };
          response.result.client.access_token =
            'Bearer ' + (await this.jwtService.signAsync(payload));
        }
        return response;
      }),
    );
  }
}

@Injectable()
export class TransformErrorInStringInterceptor implements NestInterceptor {
  private logger: Logger;
  constructor() {
    this.logger = new Logger('TransformErrorInStringInterceptor');
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (response: ReponseServiceGeneral) => {
        const data = await response;
        if (data.error) {
          const error = data.error.message;
          return { etat: data.etat, error };
        }
        return response;
      }),
    );
  }
}
