import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { prefixApi } from 'src/Constants/api';
import { FinanceService } from 'src/finance/finance.service';
import { ReponseServiceGeneral } from 'src/Interfaces/ResponseInterface';
import { ResultStateEnum, TypeTransaction } from 'src/Enum/FinanceEnum';
import { HistoricalInterface } from 'src/Interfaces/ReserveInterface';
import {
  amountAddToReserve,
  retrunInfoPaiementMarchand,
} from 'src/Utils/function/transactionAction';
import 'dotenv/config';

@Controller(prefixApi('admin'))
export class AdminController {
  private logger: Logger;
  constructor(
    private readonly adminService: AdminService,
    private readonly financeService: FinanceService,
  ) {
    this.logger = new Logger('AdminController');
  }

  @Post('/callbackTransactionDepositOperateur')
  async callbackTransactionDepositOperateur(
    @Body() depositCallBackInfo: any,
  ): Promise<ReponseServiceGeneral> {
    this.logger.log({ depositCallBackInfo });
    const transaction = await this.financeService.findOneTransaction({
      _id: depositCallBackInfo.partner_transaction_id,
    });
    this.logger.log({ transaction });
    if (transaction.etat) {
      const montant = transaction.result.montant_send_net;
      const montant_give_of_client = transaction.result.montant_give_of_client;
      if (
        (transaction.result.state === ResultStateEnum.INITIALISE ||
          transaction.result.state === ResultStateEnum.PENDING) &&
        depositCallBackInfo.status === 'SUCCESSFUL'
      ) {
        const montant_give_of_reserve = amountAddToReserve({
          percentage: transaction.result.financeAccountId.percentage as number,
          amount: transaction.result.montant_send_net,
        });
        const historical: HistoricalInterface = {
          type: TypeTransaction.DEPOSIT,
          created_at: new Date(),
          amount: montant_give_of_reserve,
          reference: transaction.result._id.toHexString(),
        };
        await this.adminService.createReserveOrUpdate({
          amount: montant_give_of_reserve,
          historical,
        });
        await this.financeService.validateTransaction(
          {
            montant_send_net: montant,
            montant_give_of_client,
            id: transaction.result._id.toHexString(),
          },
          depositCallBackInfo.gu_transaction_id,
        );

        const buyClient =
          await this.financeService.manageBalanceOfFinanceAccount({
            amount: montant_give_of_client,
            _id: transaction.result.financeAccountId._id,
            cashOut: true,
          });
        const result = {
          etat: true,
          data: {
            service: transaction.result.service,
            recipient_phone_number: transaction.result.numero,
            amount_send_net: montant,
            amount_receive_in_balance: montant_give_of_client,
            typeTransaction: TypeTransaction.DEPOSIT,
            state: ResultStateEnum.DONE,
            partner_reference: transaction.result.reference,
            transaction_reference: depositCallBackInfo.gu_transaction_id,
          },
        };

        if (buyClient.etat) {
          // Send Mail
          await retrunInfoPaiementMarchand({
            urlCallback: transaction.result.financeAccountId.urlCallback,
            data: result,
          });
          return { etat: true };
        }
        return { etat: true };
      } else if (
        (transaction.result.state === ResultStateEnum.INITIALISE ||
          transaction.result.state === ResultStateEnum.PENDING) &&
        depositCallBackInfo.status === 'FAILED'
      ) {
        await this.financeService.changeStateOnTransaction({
          state: ResultStateEnum.FAILURE,
          id: transaction.result._id.toHexString(),
        });
        const result = {
          etat: true,
          data: {
            service: transaction.result.service,
            recipient_phone_number: transaction.result.numero,
            amount_send_net: montant,
            amount_receive_in_balance: 0,
            typeTransaction: TypeTransaction.DEPOSIT,
            state: ResultStateEnum.FAILURE,
            partner_reference: transaction.result.reference,
            transaction_reference: 'N/A',
          },
        };
        // Send Mail

        await retrunInfoPaiementMarchand({
          urlCallback: transaction.result.financeAccountId.urlCallback,
          data: result,
        });
      }
    } else {
      if (depositCallBackInfo.status === 'SUCCESSFUL') {
        this.logger.error(transaction);
      }
    }
    return { etat: true };
  }

  @Post('/callbackTransactionWithdrawOperateur')
  async callbackTransactionWithdrawOperateur(
    @Body() withdrawCallBackInfo: any,
  ): Promise<ReponseServiceGeneral> {
    this.logger.log({ withdrawCallBackInfo });
    const transaction = await this.financeService.findOneTransaction({
      _id: withdrawCallBackInfo.partner_transaction_id,
    });
    this.logger.log({ transaction });
    if (transaction.etat) {
      const montant = transaction.result.montant_send_net;
      const montant_give_of_client = transaction.result.montant_give_of_client;
      if (
        (transaction.result.state === ResultStateEnum.INITIALISE ||
          transaction.result.state === ResultStateEnum.PENDING) &&
        withdrawCallBackInfo.status === 'SUCCESSFUL'
      ) {
        const montant_give_of_reserve = parseInt(
          process.env.INTOUCH_FEES_CASHIN.toString(),
          10,
        );
        const historical: HistoricalInterface = {
          type: TypeTransaction.WITHDRAW,
          created_at: new Date(),
          amount: montant_give_of_reserve,
          reference: transaction.result._id.toHexString(),
        };
        await this.adminService.createReserveOrUpdate({
          amount: montant_give_of_reserve,
          historical,
        });
        await this.financeService.validateTransaction(
          {
            montant_send_net: montant,
            montant_give_of_client,
            id: transaction.result._id.toHexString(),
          },
          withdrawCallBackInfo.gu_transaction_id,
        );

        const buyClient =
          await this.financeService.manageBalanceOfFinanceAccount({
            amount: montant_give_of_client,
            _id: transaction.result.financeAccountId._id,
            cashOut: false,
          });
        const result = {
          etat: true,
          data: {
            service: transaction.result.service,
            recipient_phone_number: transaction.result.numero,
            amount_send_net: montant,
            amount_receive_in_balance: montant_give_of_client,
            typeTransaction: TypeTransaction.WITHDRAW,
            state: ResultStateEnum.DONE,
            partner_reference: transaction.result.reference,
            transaction_reference: withdrawCallBackInfo.gu_transaction_id,
          },
        };

        if (buyClient.etat) {
          // Send Mail
          await retrunInfoPaiementMarchand({
            urlCallback: transaction.result.financeAccountId.urlCallback,
            data: result,
          });
          return { etat: true };
        }
        return { etat: true };
      } else if (
        (transaction.result.state === ResultStateEnum.INITIALISE ||
          transaction.result.state === ResultStateEnum.PENDING) &&
        withdrawCallBackInfo.status === 'FAILED'
      ) {
        await this.financeService.changeStateOnTransaction({
          state: ResultStateEnum.FAILURE,
          id: transaction.result._id.toHexString(),
        });
        const result = {
          etat: true,
          data: {
            service: transaction.result.service,
            recipient_phone_number: transaction.result.numero,
            amount_send_net: montant,
            amount_receive_in_balance: 0,
            typeTransaction: TypeTransaction.WITHDRAW,
            state: ResultStateEnum.FAILURE,
            partner_reference: transaction.result.reference,
            transaction_reference: 'N/A',
          },
        };
        await retrunInfoPaiementMarchand({
          urlCallback: transaction.result.financeAccountId.urlCallback,
          data: result,
        });
      }
    } else {
      if (withdrawCallBackInfo.status === 'SUCCESSFUL') {
        this.logger.error(transaction);
      }
    }
    return { etat: true };
  }

  @Get()
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
