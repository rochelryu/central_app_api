import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AmountDepositTransformerPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value.amount === 'string') {
      const transformedAmount = parseFloat(value.amount);

      if (isNaN(transformedAmount)) {
        throw new BadRequestException('Invalid amount value');
      }

      value.amount = transformedAmount;
    }

    if (value.amount < 200) {
      throw new BadRequestException('Amount must be at least 200');
    }

    if (value.amount % 50 !== 0) {
      throw new BadRequestException('Amount must be a multiple of 50');
    }

    return value;
  }
}

@Injectable()
export class AmountWithdrawTransformerPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value.amount === 'string') {
      const transformedAmount = parseFloat(value.amount);

      if (isNaN(transformedAmount)) {
        throw new BadRequestException('Invalid amount value');
      }

      value.amount = transformedAmount;
    }

    if (value.amount < 500) {
      throw new BadRequestException('Amount must be at least 200');
    }

    if (value.amount % 50 !== 0) {
      throw new BadRequestException('Amount must be a multiple of 50');
    }

    return value;
  }
}
