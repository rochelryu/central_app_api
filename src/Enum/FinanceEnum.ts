export enum TypePayementMobileMoney {
  WAVE = 'wave',
  ORANGE = 'orange',
  MTN = 'mtn',
  Moov = 'moov',
}

export enum ResultStateEnum {
  INITIALISE = 'INITIALISE',
  IN_WAIT = 'IN_WAIT',
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

export enum TypePayementMarchandForAggregateur {
  ORANGE = 'PAIEMENTMARCHANDOMPAYCIDIRECT',
  MTN = 'PAIEMENTMARCHAND_MTN_CI',
  Moov = 'PAIEMENTMARCHAND_MOOV_CI',
}

export enum TypePayementMarchandOutForAggregateur {
  ORANGE = 'CASHINOMCIPART',
  MTN = 'CASHINMTNPART',
  Moov = 'CASHINMOOVPART',
}
