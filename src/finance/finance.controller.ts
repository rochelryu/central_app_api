import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UsePipes,
  Logger,
  Get,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { prefixApi } from 'src/Constants/api';
import { UserGuard } from 'src/Guards/user-guard/user-guard.guard';
import { FinanceGuardGuard } from 'src/Guards/finance-guard/finance-guard.guard';
import {
  AmountDepositTransformerPipe,
  AmountWithdrawTransformerPipe,
} from 'src/Pipes/amount-transformer/amount-transformer.pipe';
import {
  ResultStateEnum,
  TypePayementMarchandCashInForAggregateur,
  TypePayementMarchandCashOutForAggregateur,
  TypeTransaction,
} from 'src/Enum/FinanceEnum';
import {
  DataInfoInterfaceFinanceAccount,
  DataInfoInterfaceTransaction,
  DataInterfaceCashInForTouchPay,
  DataInterfaceCashOutForTouchPay,
} from 'src/Interfaces/TransactionInterface';
import {
  amountAddToReserve,
  amountGiveAtClientForDeposit,
  amountGiveAtClientForWithdraw,
  attributServiceTouchCodeByMethodPaiement,
  cashInPaiementMarchand,
  cashOutPaiementMarchand,
} from 'src/Utils/function/transactionAction';
import { AdminService } from 'src/admin/admin.service';
import { HistoricalInterface } from 'src/Interfaces/ReserveInterface';
import { CreateCashinDto } from './dto/create-cashin.dto';

import 'dotenv/config';

@ApiTags('finance')
@ApiBearerAuth('access-token')
@Controller(prefixApi('finance'))
export class FinanceController {
  private logger: Logger;
  constructor(
    private readonly financeService: FinanceService,
    private readonly adminService: AdminService,
  ) {
    this.logger = new Logger('FinanceController');
  }

  @Post()
  @UseGuards(UserGuard)
  create(@Body() createFinanceDto: CreateFinanceDto, @Request() req) {
    const { _id } = req.userEntity;
    return this.financeService.create({
      appName: createFinanceDto.appName,
      urlCallback: createFinanceDto.urlCallback,
      idUser: _id,
    });
  }

  @Post('deposit')
  @UseGuards(FinanceGuardGuard)
  @UsePipes(AmountDepositTransformerPipe)
  async deposit(
    @Body()
    cashout: CreateCashoutDto,
    @Request() req,
  ) {
    const { numberClient, typeService, amount, reference, otp } = cashout;
    const dataOtp = otp ? { otp } : {};
    const newTransaction = await this.financeService.createTransaction({
      reference,
      numero: numberClient,
      typeTransaction: TypeTransaction.DEPOSIT,
      service: typeService,
      montant_send_net: amount,
      montant_give_of_client: amountGiveAtClientForDeposit({
        percentage: req.financeAccount.percentage as number,
        amount,
      }),
      financeAccountId: req.financeAccount._id,
      state: ResultStateEnum.INITIALISE,
    });

    if (newTransaction.etat) {
      const infoCashOutOperation: DataInterfaceCashOutForTouchPay = {
        serviceCode: attributServiceTouchCodeByMethodPaiement({
          typePaiement: typeService,
          cashIn: false,
        }) as TypePayementMarchandCashOutForAggregateur,
        idFromClient: newTransaction.result._id.toString(),
        amount,
        additionnalInfos: {
          recipientEmail: process.env.EMAIL_CENTRAL,
          recipientFirstName: req.financeAccount.appName,
          recipientLastName: req.financeAccount.appName,
          destinataire: numberClient,
          ...dataOtp,
        },
        callback: process.env.INTOUCH_CALLBACK_OUT,
        recipientNumber: numberClient,
      };

      const depositRequestFromPartner =
        await cashOutPaiementMarchand(infoCashOutOperation);

      if (depositRequestFromPartner.etat) {
        if (
          depositRequestFromPartner.result.json.status === 300 ||
          depositRequestFromPartner.result.json.status === 'FAILED'
        ) {
          // erreur d'enregistrement de l'operation au niveau du partenaire
          // notifier à l'utilisateur que la transaction n'a pa pu être crée en lui retournant les raisons du partenaire
          let alertMessage: string =
            depositRequestFromPartner.result.json.detailMessage ??
            depositRequestFromPartner.result.json.message;
          await this.financeService.deleteTransactionByItem({
            _id: newTransaction.result._id,
          });
          alertMessage =
            alertMessage.indexOf('INTERNAL_PROCESSING_ERROR') !== -1 ||
            alertMessage.indexOf(
              'Votre solde Orange Money est insuffisant.',
            ) !== -1
              ? 'Votre solde MOBILE MONEY est insuffisant pour effectuer cette opération. 😾'
              : alertMessage.indexOf(
                    'A similar transaction was done recently,',
                  ) !== -1
                ? "Une transaction similaire a été faites récemment, veuillez attendre dans quelques instants avant de relancer l'opération."
                : "Code incorrect. Votre paiement n'a pas été pris en compte. 🤕";
          return { etat: false, error: alertMessage };
        } else if (
          depositRequestFromPartner.result.json.status === 'SUCCESSFUL'
        ) {
          // Only paiement successfull for Orange Money

          const montant = depositRequestFromPartner.result.json.amount;
          const montant_give_of_client = amountGiveAtClientForDeposit({
            percentage: req.financeAccount.percentage as number,
            amount: montant,
          });
          const montant_give_of_reserve = amountAddToReserve({
            percentage: req.financeAccount.percentage as number,
            amount,
          });
          const historical: HistoricalInterface = {
            type: TypeTransaction.DEPOSIT,
            created_at: new Date(),
            amount: montant_give_of_reserve,
            reference: newTransaction.result._id.toHexString(),
          };
          await this.adminService.createReserveOrUpdate({
            amount: montant_give_of_reserve,
            historical,
          });

          await this.financeService.validateTransaction(
            {
              montant_send_net: montant,
              montant_give_of_client,
              id: newTransaction.result._id.toHexString(),
            },
            depositRequestFromPartner.result.json.idFromGU,
          );
          const buyClient =
            await this.financeService.manageBalanceOfFinanceAccount({
              amount: montant_give_of_client,
              _id: req.financeAccount._id,
              cashOut: true,
            });
          const result = {
            etat: true,
            data: {
              service: typeService,
              recipient_phone_number: newTransaction.result.numero,
              amount_send_net: montant,
              amount_receive_in_balance: montant_give_of_client,
              typeTransaction: TypeTransaction.DEPOSIT,
              state: ResultStateEnum.DONE,
              partner_reference: newTransaction.result.reference,
              transaction_reference:
                depositRequestFromPartner.result.json.idFromGU,
            },
          };

          if (buyClient.etat) {
            // Send Mail

            // await retrunInfoPaiementMarchand({
            //   urlCallback: req.financeAccount.urlCallback,
            //   data: result,
            // });
            return result;
          }
          return result;
        } else if (
          depositRequestFromPartner.result.json.status === 'INITIATED' ||
          depositRequestFromPartner.result.json.status === 'PENDING'
        ) {
          await this.financeService.changeStateOnTransaction({
            state: ResultStateEnum.PENDING,
            id: newTransaction.result._id.toHexString(),
          });
          const result = {
            etat: true,
            data: {
              service: typeService,
              recipient_phone_number: newTransaction.result.numero,
              amount_send_net: amount,
              amount_receive_in_balance: amountGiveAtClientForDeposit({
                percentage: req.financeAccount.percentage as number,
                amount,
              }),
              typeTransaction: TypeTransaction.DEPOSIT,
              state: ResultStateEnum.PENDING,
              partner_reference: newTransaction.result.reference,
              transaction_reference: '',
            },
          };
          return result;
        } else {
          this.logger.error(depositRequestFromPartner.result.json);
          await this.financeService.changeStateOnTransaction({
            state: ResultStateEnum.FAILURE,
            id: newTransaction.result._id.toHexString(),
          });
          const result = {
            etat: true,
            data: {
              service: typeService,
              recipient_phone_number: newTransaction.result.numero,
              amount_send_net: amount,
              amount_receive_in_balance: 0,
              typeTransaction: TypeTransaction.DEPOSIT,
              state: ResultStateEnum.FAILURE,
              partner_reference: newTransaction.result.reference,
              transaction_reference: 'N/A',
            },
          };
          return result;
        }
      } else {
        // erreur d'enregistrement de l'operation au niveau du partenaire
        // notifier à l'utilisateur que la transaction n'a pa pu être crée en lui retournant les raisons du partenaire
        await this.financeService.deleteTransactionByItem({
          _id: newTransaction.result._id,
        });
        return {
          etat: false,
          error: `Problème avec le service ${typeService.toLocaleUpperCase()}, veuillez nous excusez nous le rendrons disponible pour vous dans les plus brefs délais. 👨‍💻👩‍💻`,
        };
      }
    }
    return newTransaction;
  }

  @Post('withdraw')
  @UseGuards(FinanceGuardGuard)
  @UsePipes(AmountWithdrawTransformerPipe)
  async withdraw(
    @Body()
    cashin: CreateCashinDto,
    @Request() req,
  ) {
    const { numberClient, typeService, amount, reference } = cashin;
    if (req.financeAccount.balance >= amount) {
      const newTransaction = await this.financeService.createTransaction({
        reference,
        numero: numberClient,
        typeTransaction: TypeTransaction.WITHDRAW,
        service: typeService,
        montant_send_net: amount,
        montant_give_of_client: amountGiveAtClientForWithdraw({
          amount,
        }),
        financeAccountId: req.financeAccount._id,
        state: ResultStateEnum.INITIALISE,
      });

      if (newTransaction.etat) {
        const infoCashInOperation: DataInterfaceCashInForTouchPay = {
          service_id: attributServiceTouchCodeByMethodPaiement({
            typePaiement: typeService,
            cashIn: true,
          }) as TypePayementMarchandCashInForAggregateur,
          recipient_phone_number: numberClient,
          amount,
          call_back_url: process.env.INTOUCH_CALLBACK_IN,
          partner_id: process.env.INTOUCH_PARTNER_ID,
          partner_transaction_id: newTransaction.result._id.toHexString(),
          login_api: process.env.INTOUCH_LOGIN_API,
          password_api: process.env.INTOUCH_PASSWORD_API,
        };

        const withdrawRequestFromPartner =
          await cashInPaiementMarchand(infoCashInOperation);

        if (withdrawRequestFromPartner.etat) {
          const montant = amount;
          const montant_give_of_client = amountGiveAtClientForWithdraw({
            amount,
          });
          const montant_give_of_reserve = parseInt(
            process.env.INTOUCH_FEES_CASHIN.toString(),
            10,
          );
          if (withdrawRequestFromPartner.result.status === 'SUCCESSFUL') {
            const historical: HistoricalInterface = {
              type: TypeTransaction.WITHDRAW,
              created_at: new Date(),
              amount: montant_give_of_reserve,
              reference: newTransaction.result._id.toHexString(),
            };
            await this.adminService.createReserveOrUpdate({
              amount: montant_give_of_reserve,
              historical,
            });

            await this.financeService.validateTransaction(
              {
                montant_send_net: montant,
                montant_give_of_client,
                id: newTransaction.result._id.toHexString(),
              },
              withdrawRequestFromPartner.result.gu_transaction_id,
            );
            const debitClient =
              await this.financeService.manageBalanceOfFinanceAccount({
                amount: montant_give_of_client,
                _id: req.financeAccount._id,
                cashOut: false,
              });
            const result = {
              etat: true,
              data: {
                service: typeService,
                recipient_phone_number: newTransaction.result.numero,
                amount_send_net: montant,
                amount_receive_in_balance: montant_give_of_client,
                typeTransaction: TypeTransaction.WITHDRAW,
                state: ResultStateEnum.DONE,
                partner_reference: newTransaction.result.reference,
                transaction_reference:
                  withdrawRequestFromPartner.result.gu_transaction_id,
              },
            };

            if (debitClient.etat) {
              // Send Mail

              // await retrunInfoPaiementMarchand({
              //   urlCallback: req.financeAccount.urlCallback,
              //   data: result,
              // });
              return result;
            }
            return result;
          } else if (
            withdrawRequestFromPartner.result.status === 'INITIATED' ||
            withdrawRequestFromPartner.result.status === 'PENDING'
          ) {
            await this.financeService.changeStateOnTransaction({
              state: ResultStateEnum.PENDING,
              id: newTransaction.result._id.toHexString(),
            });
            const result = {
              etat: true,
              data: {
                service: typeService,
                recipient_phone_number: newTransaction.result.numero,
                amount_send_net: amount,
                amount_receive_in_balance: montant_give_of_client,
                typeTransaction: TypeTransaction.WITHDRAW,
                state: ResultStateEnum.PENDING,
                partner_reference: newTransaction.result.reference,
                transaction_reference: '',
              },
            };
            return result;
          } else {
            this.logger.error(withdrawRequestFromPartner.result);
            await this.financeService.changeStateOnTransaction({
              state: ResultStateEnum.FAILURE,
              id: newTransaction.result._id.toHexString(),
            });
            const result = {
              etat: true,
              data: {
                service: typeService,
                recipient_phone_number: newTransaction.result.numero,
                amount_send_net: amount,
                amount_receive_in_balance: 0,
                typeTransaction: TypeTransaction.WITHDRAW,
                state: ResultStateEnum.FAILURE,
                partner_reference: newTransaction.result.reference,
                transaction_reference: 'N/A',
              },
            };
            return result;
          }
        } else {
          // erreur d'enregistrement de l'operation au niveau du partenaire
          // notifier à l'utilisateur que la transaction n'a pa pu être crée en lui retournant les raisons du partenaire
          await this.financeService.deleteTransactionByItem({
            _id: newTransaction.result._id,
          });
          return {
            etat: false,
            error: `Problème avec le service ${typeService.toLocaleUpperCase()}, veuillez nous excusez nous le rendrons disponible pour vous dans les plus brefs délais. 👨‍💻👩‍💻`,
          };
        }
      }
      return newTransaction;
    } else {
      return {
        etat: false,
        error: new Error(
          'Votre solde est insufisant pour effectuer cette opération.',
        ),
      };
    }
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financeService.remove(+id);
  }

  @Get()
  @UseGuards(UserGuard)
  async getAllAccount(@Request() req) {
    const { _id } = req.userEntity;
    const financeAccounts = await this.financeService.getAllAccountByItem({
      idUser: _id,
    });
    const allFinanceAccountInfo: DataInfoInterfaceFinanceAccount[] = [];
    for (const financeAccount of financeAccounts.result) {
      const allTransactionForAccount =
        await this.financeService.getAllTransactionByItem({
          financeAccountId: financeAccount._id,
        });
      const transactions: DataInfoInterfaceTransaction[] =
        allTransactionForAccount.result.map((transaction) => ({
          numero: transaction.numero,
          reference: transaction.reference,
          montant_send_net: transaction.montant_send_net,
          montant_give_of_client: transaction.montant_give_of_client,
          service: transaction.service,
          typeTransaction: transaction.typeTransaction,
          state: transaction.state,
          ref_partner: transaction.ref_partner,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        }));
      const financeAccountInfo: DataInfoInterfaceFinanceAccount = {
        appName: financeAccount.appName,
        percentage: financeAccount.percentage,
        balance: financeAccount.balance,
        urlCallback: financeAccount.urlCallback,
        clientId: financeAccount.clientId,
        clientSecret: financeAccount.clientSecret,
        transactions,
      };
      allFinanceAccountInfo.push(financeAccountInfo);
    }
    return { etat: true, result: allFinanceAccountInfo };
  }
}
