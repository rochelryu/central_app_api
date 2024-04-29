import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { prefixApi } from 'src/Constants/api';

@Controller(prefixApi('sms'))
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post()
  create() {
    return ''; // this.smsService.create(createSmDto);
  }

  @Get()
  findAll() {
    return this.smsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.smsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return '' // this.smsService.update(+id, updateSmDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.smsService.remove(+id);
  }
}
