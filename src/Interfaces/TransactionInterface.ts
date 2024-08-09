import {
  ResultStateEnum,
  TypePayementMarchandForAggregateur,
  TypePayementMarchandOutForAggregateur,
  TypePayementMobileMoney,
  TypeTransaction,
} from 'src/Enum/FinanceEnum';

export interface DataInterfaceCashInForTouchPay {
  serviceCode: TypePayementMarchandForAggregateur;
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

export interface DataInterfaceCashOutForTouchPay {
  service_id: TypePayementMarchandOutForAggregateur;
  recipient_phone_number: string;
  amount: number;
  call_back_url: string;
  partner_id: string;
  partner_transaction_id: string;
  login_api: string;
  password_api: string;
}

export interface DataInfoPaiementMarchand {
  service: TypePayementMobileMoney;
  recipient_phone_number: string;
  amount_send_net: number;
  amount_receive_in_balance: number;
  typeTransaction: TypeTransaction;
  state: ResultStateEnum;
  partner_reference: string;
  transaction_reference: string;
}
