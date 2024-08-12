export enum TypePayementMobileMoney {
  WAVE = 'wave',
  ORANGE = 'orange',
  MTN = 'mtn',
  Moov = 'moov',
}

export enum ResultStateEnum {
  INITIALISE = 'INITIALISE',
  PENDING = 'PENDING',
  DONE = 'DONE',
  FAILURE = 'FAILURE',
  SUSPECT = 'SUSPECT',
  CANCELED = 'CANCELED',
  TIMEOUT = 'TIMEOUT',
}

export enum TypeTransaction {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
}

export enum TypePayementMarchandCashOutForAggregateur {
  ORANGE = 'PAIEMENTMARCHANDOMPAYCIDIRECT',
  MTN = 'PAIEMENTMARCHAND_MTN_CI',
  Moov = 'PAIEMENTMARCHAND_MOOV_CI',
}

export enum TypePayementMarchandCashInForAggregateur {
  ORANGE = 'CASHINOMCIPART',
  MTN = 'CASHINMTNPART',
  Moov = 'CASHINMOOVPART',
}
