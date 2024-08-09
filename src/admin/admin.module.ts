import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { allEntity } from 'src/Constants/allEntity';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceService } from 'src/finance/finance.service';

@Module({
  imports: [MongooseModule.forFeature(allEntity)],
  controllers: [AdminController],
  providers: [AdminService, FinanceService],
})
export class AdminModule {}
