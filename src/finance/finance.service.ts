import { Injectable, Logger } from '@nestjs/common';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FinanceAccount } from 'src/finance/entities/finance.entity';
import { hash } from 'bcrypt';
import { ReponseServiceGeneral } from 'src/Interfaces/ResponseInterface';
import { generateRecovery } from 'src/Utils/function/recoveryAction';
import { randomBytes } from 'crypto';
import { Transaction } from './entities/transaction.entity';
import { Schema as SchemaNatif } from 'mongoose';
import {
  ResultStateEnum,
  TypePayementMobileMoney,
  TypeTransaction,
} from 'src/Enum/FinanceEnum';

@Injectable()
export class FinanceService {
  private logger: Logger;
  constructor(
    @InjectModel(FinanceAccount.name)
    private readonly financeAccountModel: Model<FinanceAccount>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {
    this.logger = new Logger('FinanceService');
  }

  create(createFinanceDto: {
    appName: string;
    urlCallback: string;
    idUser;
  }): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.financeAccountModel
        .findOne({ appName: createFinanceDto.appName.trim() })
        .then(async (result) => {
          if (result) {
            next({
              etat: false,
              error: new Error(
                "Ce nom d'application existe déjà veuillez en prendre un autre.",
              ),
            });
          } else {
            const clientId = randomBytes(16).toString('hex');
            const clientSecret = randomBytes(32).toString('hex');
            const financeAccount = new this.financeAccountModel({
              idUser: createFinanceDto.idUser,
              appName: createFinanceDto.appName,
              urlCallback: createFinanceDto.urlCallback.trim(),
              clientId,
              clientSecret,
            });
            await financeAccount
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

  createTransaction(createTransaction: {
    reference: string;
    montant_send_net: number;
    montant_give_of_client: number;
    numero: string;
    financeAccountId: SchemaNatif.Types.ObjectId;
    service: TypePayementMobileMoney;
    typeTransaction: TypeTransaction;
    state: ResultStateEnum;
  }): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      const transaction = new this.transactionModel({
        ...createTransaction,
        recovery: generateRecovery(),
      });
      await transaction
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
    });
  }

  async validateTransaction(
    item: {
      montant_send_net: number;
      montant_give_of_client: number;
      id: string;
    },
    ref_partner: string = '',
  ): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.transactionModel
        .findOne({
          _id: item.id,
          $or: [
            { state: ResultStateEnum.INITIALISE },
            { state: ResultStateEnum.IN_WAIT },
          ],
        })
        .then(async (result) => {
          if (result) {
            await this.transactionModel
              .findOneAndUpdate(
                { _id: result._id },
                {
                  $set: {
                    state: ResultStateEnum.DONE,
                    montant_send_net: item.montant_send_net,
                    montant_give_of_client: item.montant_give_of_client,
                    ref_partner,
                  },
                },
                { new: true },
              )
              .then((res) => {
                next({ etat: true, result: res });
              })
              .catch((error) => {
                next({ etat: false, error });
              });
          } else {
            const message =
              'Erreur transansaction introuvable dans la bd local';
            this.logger.error({ ...item, message });
            next({ etat: false, error: new Error(message) });
          }
        })
        .catch((error) => next({ etat: false, error }));
    });
  }

  async changeStateOnTransaction(item: {
    state: ResultStateEnum;
    id: string;
  }): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.transactionModel
        .findOneAndUpdate(
          { _id: item.id },
          {
            $set: {
              state: item.state,
            },
          },
          { new: true },
        )
        .then((res) => {
          next({ etat: true, result: res });
        })
        .catch((error) => {
          next({ etat: false, error });
        });
    });
  }

  async depositInFinanceAccount(item: {
    amount: number;
    _id: SchemaNatif.Types.ObjectId;
  }): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.financeAccountModel
        .findOne({
          _id: item._id,
        })
        .then(async (result) => {
          if (result) {
            result.balance += item.amount;
            await result
              .save()
              .then((res) => {
                next({ etat: true, result: res });
              })
              .catch((error) => {
                next({ etat: false, error });
              });
          } else {
            const message =
              'Erreur Finance Account introuvable dans la bd local';
            this.logger.error({ ...item, message });
            next({ etat: false, error: new Error(message) });
          }
        })
        .catch((error) => next({ etat: false, error }));
    });
  }

  async deleteTransactionByItem(item: any) {
    return new Promise(async (next) => {
      await this.transactionModel
        .findOneAndDelete(item)
        .then((result) => {
          next({ etat: true, result });
        })
        .catch((error) => {
          next({ etat: false, error });
        });
    });
  }

  findAll() {
    return `This action returns all finance`;
  }

  async findOneTransaction(item: any): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.transactionModel
        .findOne(item)
        .populate(['financeAccountId'])
        .then((result) => {
          next({ etat: true, result });
        })
        .catch((error) => {
          next({ etat: false, error });
        });
    });
  }

  update(id: number, updateFinanceDto: UpdateFinanceDto) {
    return `This action updates a #${id} finance`;
  }

  remove(id: number) {
    return `This action removes a #${id} finance`;
  }
}
