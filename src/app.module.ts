import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { allEntity } from './Constants/allEntity';
import { jwtConstants } from './Constants/auth';
import { SmsModule } from './sms/sms.module';
import 'dotenv/config';

Logger.log(process.env.MONGO_LOCAL, '.env');
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_LOCAL),
    MongooseModule.forFeature(allEntity),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '3d' },
    }),
    UserModule,
    SmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
