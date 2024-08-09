import { Injectable, Logger } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FinanceAccount } from 'src/finance/entities/finance.entity';
import { Transaction } from 'src/finance/entities/transaction.entity';
import { Reserve } from './entities/reserve.entity';
import { HistoricalInterface } from 'src/Interfaces/ReserveInterface';

@Injectable()
export class AdminService {
  private logger: Logger;
  constructor(
    @InjectModel(FinanceAccount.name)
    private readonly financeAccountModel: Model<FinanceAccount>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Reserve.name)
    private readonly reserveModel: Model<Reserve>,
  ) {
    this.logger = new Logger('ReserveService');
  }
  async createReserveOrUpdate(item: {
    amount: number;
    historical: HistoricalInterface;
  }) {
    return new Promise(async (next) => {
      await this.reserveModel
        .findOne({})
        .then(async (result) => {
          if (result) {
            result.balance += item.amount;
            result.historical.unshift(item.historical);
            await result
              .save()
              .then((result) => {
                next({
                  etat: true,
                  result,
                });
              })
              .catch((error) => {
                next({ etat: false, error });
              });
          } else {
            const newReserve = new this.reserveModel({
              balance: item.amount,
              historical: [item.historical],
            });
            await newReserve
              .save()
              .then((result) => {
                next({
                  etat: true,
                  result,
                });
              })
              .catch((error) => {
                next({ etat: false, error });
              });
          }
        })
        .catch((error) => {
          next({ etat: false, error });
        });
    });
  }

  findAll() {
    return `This action returns all admin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}
