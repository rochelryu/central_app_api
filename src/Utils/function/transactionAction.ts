import {
  TypePayementMarchandForAggregateur,
  TypePayementMarchandOutForAggregateur,
  TypePayementMobileMoney,
} from 'src/Enum/FinanceEnum';
import { ReponseServiceGeneral } from 'src/Interfaces/ResponseInterface';
import {
  DataInfoPaiementMarchand,
  DataInterfaceCashInForTouchPay,
  DataInterfaceCashOutForTouchPay,
} from 'src/Interfaces/TransactionInterface';
import { HttpClient } from 'urllib';
import axios from 'axios';
import 'dotenv/config';

export const attributServiceTouchCodeByMethodPaiement = (item: {
  typePaiement: TypePayementMobileMoney;
  cashIn: boolean;
}):
  | TypePayementMarchandForAggregateur
  | TypePayementMarchandOutForAggregateur
  | TypePayementMobileMoney => {
  switch (item.typePaiement) {
    case TypePayementMobileMoney.ORANGE:
      return item.cashIn
        ? TypePayementMarchandForAggregateur.ORANGE
        : TypePayementMarchandOutForAggregateur.ORANGE;
    case TypePayementMobileMoney.MTN:
      return item.cashIn
        ? TypePayementMarchandForAggregateur.MTN
        : TypePayementMarchandOutForAggregateur.MTN;
    case TypePayementMobileMoney.Moov:
      return item.cashIn
        ? TypePayementMarchandForAggregateur.Moov
        : TypePayementMarchandOutForAggregateur.Moov;
    default:
      return item.typePaiement;
  }
};

export async function cashInPaiementMarchand(
  data: DataInterfaceCashInForTouchPay,
): Promise<ReponseServiceGeneral> {
  const httpclient = new HttpClient();

  return new Promise(async (next) => {
    await httpclient
      .request(process.env.ENDPOINT_PAIEMENT, {
        headers: { 'Content-Type': 'application/json', Accept: '*/*' },
        method: 'PUT',
        digestAuth: `${process.env.INTOUCH_USERNAME.trim()}:${process.env.INTOUCH_PASSWORD.trim()}`,
        dataType: 'json',
        data,
      })
      .then(
        // Once we have data returned ...
        (response) => {
          const json = response.data;
          const status = response.status;

          next({ etat: true, result: { status, json } });
        },
      )
      .catch((error) => {
        next({ etat: false, error });
      });
  });
}

export async function cashOutPaiementMarchand(
  data: DataInterfaceCashOutForTouchPay,
): Promise<ReponseServiceGeneral> {
  const AxiosInstance = axios.create();
  return new Promise(async (next) => {
    AxiosInstance.post(process.env.ENDPOINT_CASHOUT, data, {
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      auth: {
        username: process.env.INTOUCH_USERNAME,
        password: process.env.INTOUCH_PASSWORD,
      },
    })
      .then(
        // Once we have data returned ...
        (response) => {
          const json = response.data;
          next({ etat: true, result: json });
        },
      )
      .catch((error) => {
        next({ etat: false, error });
      });
  });
}

export async function retrunInfoPaiementMarchand(body: {
  data: { etat: boolean; data: DataInfoPaiementMarchand };
  urlCallback: string;
}): Promise<ReponseServiceGeneral> {
  const AxiosInstance = axios.create();
  return new Promise(async (next) => {
    AxiosInstance.post(body.urlCallback, body.data, {
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
    })
      .then((response) => {
        const json = response.data;
        next({ etat: true, result: json });
      })
      .catch((error) => {
        next({ etat: false, error });
      });
  });
}

export const amountGiveAtClient = ({
  percentage,
  amount,
}: {
  percentage: number;
  amount: number;
}) => (1 - percentage) * amount;

export const amountAddToReserve = ({
  percentage,
  amount,
}: {
  percentage: number;
  amount: number;
}) =>
  (percentage - parseFloat(process.env.INTOUCH_FEES_CASHIN.toString())) *
  amount;
