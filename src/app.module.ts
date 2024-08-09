import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { allEntity } from './Constants/allEntity';
import { jwtConstants } from './Constants/auth';
import { SmsModule } from './sms/sms.module';
import { FinanceModule } from './finance/finance.module';
import { AdminModule } from './admin/admin.module';
import 'dotenv/config';

Logger.debug(process.env.MONGO_HOST, '.env');
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_HOST),
    MongooseModule.forFeature(allEntity),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '3d' },
    }),
    UserModule,
    SmsModule,
    FinanceModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
