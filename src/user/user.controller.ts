import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { TransformResultInJwtInterceptor } from 'src/Interceptors/ToResponse/Transform.result.in.jwt';
import { prefixApi } from 'src/Constants/api';
import { AuthenticationUserDto } from './dto/authentication-user.dto';
import { UserGuard } from 'src/Guards/user-guard/user-guard.guard';

@Controller(prefixApi('user'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  @UseInterceptors(TransformResultInJwtInterceptor)
  async signup(@Body() createUserDto: CreateUserDto) {
    const newClient = await this.userService.create(createUserDto);
    if (newClient.etat) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { recovery, ...rest } = newClient.result;
      return { etat: newClient.etat, result: { client: rest } };
    }
    return newClient;
  }

  @Post('signin')
  @UseInterceptors(TransformResultInJwtInterceptor)
  async signin(@Body() authenticationUserDto: AuthenticationUserDto) {
    const newClient = await this.userService.verifyUserForLogin(
      authenticationUserDto,
    );
    if (newClient.etat) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { recovery, ...rest } = newClient.result;
      return { etat: newClient.etat, result: { client: rest } };
    }
    return newClient;
  }

  @Get()
  @UseGuards(UserGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
