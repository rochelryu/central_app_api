import { TypeTransaction } from 'src/Enum/FinanceEnum';

export interface HistoricalInterface {
  type: TypeTransaction;
  created_at: Date;
  amount: number;
  reference: string;
}
