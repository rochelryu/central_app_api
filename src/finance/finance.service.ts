import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FinanceAccount } from 'src/finance/entities/finance.entity';
// import { hash } from 'bcrypt';
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

  getAllAccountByItem(item): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.financeAccountModel
        .find(item)
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
      await this.transactionModel
        .findOne({
          $and: [
            { numero: createTransaction.numero },
            { financeAccountId: createTransaction.financeAccountId },
            { typeTransaction: createTransaction.typeTransaction },
            {
              $or: [{ state: ResultStateEnum.PENDING }],
            },
          ],
        })
        .then(async (res) => {
          if (!res) {
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
          } else {
            next({
              etat: false,
              error: new Error(
                "Une transaction vers se numero est déjà en cours veuillez patienter qu'on l'à finalise",
              ),
            });
          }
        })
        .catch((error) => next({ etat: false, error }));
    });
  }

  getAllTransactionByItem(item): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.transactionModel
        .find(item)
        .sort({ _id: -1 })
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
            { state: ResultStateEnum.PENDING },
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

  async manageBalanceOfFinanceAccount(item: {
    amount: number;
    _id: SchemaNatif.Types.ObjectId;
    cashOut: boolean;
  }): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.financeAccountModel
        .findOne({
          _id: item._id,
        })
        .then(async (result) => {
          if (result) {
            result.balance += item.cashOut ? item.amount : -item.amount;
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

  remove(id: number) {
    return `This action removes a #${id} finance`;
  }
}
