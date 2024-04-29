import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { allEntity } from 'src/Constants/allEntity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature(allEntity)],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
