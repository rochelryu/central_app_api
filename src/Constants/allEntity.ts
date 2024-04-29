import { SmsUser, SmsUserSchema } from 'src/sms/entities/smsUser.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';

export const allEntity = [
  { name: User.name, schema: UserSchema },
  { name: SmsUser.name, schema: SmsUserSchema },
];
