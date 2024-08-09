import { Reserve, ReserveSchema } from 'src/admin/entities/reserve.entity';
import {
  FinanceAccount,
  FinanceAccountSchema,
} from 'src/finance/entities/finance.entity';
import {
  Transaction,
  TransactionSchema,
} from 'src/finance/entities/transaction.entity';
import { SmsUser, SmsUserSchema } from 'src/sms/entities/smsUser.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';

export const allEntity = [
  { name: User.name, schema: UserSchema },
  { name: SmsUser.name, schema: SmsUserSchema },
  { name: FinanceAccount.name, schema: FinanceAccountSchema },
  { name: Transaction.name, schema: TransactionSchema },
  { name: Reserve.name, schema: ReserveSchema },
];
