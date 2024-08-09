import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { prefixApi } from 'src/Constants/api';
import { UserGuard } from 'src/Guards/user-guard/user-guard.guard';
import { FinanceGuardGuard } from 'src/Guards/finance-guard/finance-guard.guard';
import { AmountTransformerPipe } from 'src/pipes/amount-transformer/amount-transformer.pipe';
import {
  ResultStateEnum,
  TypePayementMarchandForAggregateur,
  TypeTransaction,
} from 'src/Enum/FinanceEnum';
import { DataInterfaceCashInForTouchPay } from 'src/Interfaces/TransactionInterface';
import {
  amountAddToReserve,
  amountGiveAtClient,
  attributServiceTouchCodeByMethodPaiement,
  cashInPaiementMarchand,
} from 'src/Utils/function/transactionAction';
import { AdminService } from 'src/admin/admin.service';
import { HistoricalInterface } from 'src/Interfaces/ReserveInterface';

@ApiTags('finance')
@ApiBearerAuth('access-token')
@Controller(prefixApi('finance'))
@UseGuards(UserGuard)
export class FinanceController {
  private logger: Logger;
  constructor(
    private readonly financeService: FinanceService,
    private readonly adminService: AdminService,
  ) {
    this.logger = new Logger('FinanceController');
  }

  @Post()
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
  @UsePipes(new AmountTransformerPipe())
  async deposit(
    @Body()
    cashout: CreateCashoutDto,
    @Request() req,
  ) {
    const { numberClient, typeService, amount, reference, otp } = cashout;
    // console.log(cashout, req.userEntity, req.financeAccount);
    const dataOtp = otp ? { otp } : {};
    const newTransaction = await this.financeService.createTransaction({
      reference,
      numero: numberClient,
      typeTransaction: TypeTransaction.DEPOSIT,
      service: typeService,
      montant_send_net: amount,
      montant_give_of_client: amountGiveAtClient({
        percentage: req.financeAccount.percentage as number,
        amount,
      }),
      financeAccountId: req.financeAccount._id,
      state: ResultStateEnum.INITIALISE,
    });

    if (newTransaction.etat) {
      const infoCashInOperation: DataInterfaceCashInForTouchPay = {
        serviceCode: attributServiceTouchCodeByMethodPaiement({
          typePaiement: typeService,
          cashIn: true,
        }) as TypePayementMarchandForAggregateur,
        idFromClient: newTransaction.result._id.toString(),
        amount,
        additionnalInfos: {
          recipientEmail: process.env.EMAIL_CENTRAL,
          recipientFirstName: req.financeAccount.appName,
          recipientLastName: req.financeAccount.appName,
          destinataire: numberClient,
          ...dataOtp,
        },
        callback: process.env.INTOUCH_CALLBACK,
        recipientNumber: numberClient,
      };

      const depositRequestFromPartner =
        await cashInPaiementMarchand(infoCashInOperation);

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
          const montant_give_of_client = amountGiveAtClient({
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
          const buyClient = await this.financeService.depositInFinanceAccount({
            amount: montant_give_of_client,
            _id: req.financeAccount._id,
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
            state: ResultStateEnum.IN_WAIT,
            id: newTransaction.result._id.toHexString(),
          });
          const result = {
            etat: true,
            data: {
              service: typeService,
              recipient_phone_number: newTransaction.result.numero,
              amount_send_net: amount,
              amount_receive_in_balance: amountGiveAtClient({
                percentage: req.financeAccount.percentage as number,
                amount,
              }),
              typeTransaction: TypeTransaction.DEPOSIT,
              state: ResultStateEnum.IN_WAIT,
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFinanceDto: UpdateFinanceDto) {
    return this.financeService.update(+id, updateFinanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financeService.remove(+id);
  }
}
