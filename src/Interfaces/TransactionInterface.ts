import {
  ResultStateEnum,
  TypePayementMarchandCashOutForAggregateur,
  TypePayementMarchandCashInForAggregateur,
  TypePayementMobileMoney,
  TypeTransaction,
} from 'src/Enum/FinanceEnum';

export interface DataInterfaceCashOutForTouchPay {
  serviceCode: TypePayementMarchandCashOutForAggregateur;
  idFromClient: string;
  amount: number;
  callback: string;
  recipientNumber: string;
  additionnalInfos: {
    recipientEmail: string;
    recipientFirstName: string;
    recipientLastName: string;
    destinataire: string;
    otp?: string;
  };
}

export interface DataInterfaceCashInForTouchPay {
  service_id: TypePayementMarchandCashInForAggregateur;
  recipient_phone_number: string;
  amount: number;
  call_back_url: string;
  partner_id: string;
  partner_transaction_id: string;
  login_api: string;
  password_api: string;
}

export interface DataInfoInterfacePaiementMarchandForCentralApi {
  service: TypePayementMobileMoney;
  recipient_phone_number: string;
  amount_send_net: number;
  amount_receive_in_balance: number;
  typeTransaction: TypeTransaction;
  state: ResultStateEnum;
  partner_reference: string;
  transaction_reference: string;
}

export interface DataInfoInterfaceFinanceAccount {
  appName: string;
  percentage: number;
  balance: number;
  urlCallback: string;
  clientId: string;
  clientSecret: string;
  transactions: DataInfoInterfaceTransaction[];
}

export interface DataInfoInterfaceTransaction {
  financeAccountId: string;
  montant_give_of_client: number;
  montant_send_net: number;
  typeTransaction: TypeTransaction;
  state: ResultStateEnum;
  service: TypePayementMobileMoney;
  numero: string;
  ref_partner: string;
  reference: string;
  created_at: Date;
  updated_at: Date;
}
