import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { allEntity } from 'src/Constants/allEntity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from 'src/admin/admin.service';

@Module({
  imports: [MongooseModule.forFeature(allEntity)],
  controllers: [FinanceController],
  providers: [FinanceService, AdminService],
})
export class FinanceModule {}
