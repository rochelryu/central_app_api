import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { ReponseServiceGeneral } from 'src/Interfaces/ResponseInterface';
import { generateRecovery } from 'src/Utils/function/recoveryAction';
import { compare, hash } from 'bcrypt';
import 'dotenv/config';
import { AuthenticationUserDto } from './dto/authentication-user.dto';

@Injectable()
export class UserService {
  private logger: Logger;
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    this.logger = new Logger('UserService');
  }

  create(createUserDto: CreateUserDto): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.userModel
        .findOne({ email: createUserDto.email.trim() })
        .then(async (result) => {
          if (result) {
            next({
              etat: false,
              error: new Error(
                "Ce mail appartient déjà à un autre compte, s'il est vôtre alors veuillez vous connecter plutôt",
              ),
            });
          } else {
            const recovery = generateRecovery();
            const pass = await hash(
              createUserDto.password.trim(),
              Number(process.env.CRYPTO_DIGEST),
            );
            createUserDto.password = pass;
            const newUser = new this.userModel({
              ...createUserDto,
              recovery,
            });
            await newUser
              .save()
              .then((result) => {
                const {
                  _id,
                  email,
                  prefix,
                  number,
                  recovery,
                  gravatar,
                  role,
                  companie,
                } = result;

                next({
                  etat: true,
                  result: {
                    _id,
                    email,
                    prefix,
                    number,
                    recovery,
                    gravatar,
                    role,
                    companie,
                  },
                });
              })
              .catch((error) => {
                next({ etat: false, error });
              });
          }
        })
        .catch((error) => {
          next({ etat: false, error });
        });
    });
  }

  async verifyUserForLogin(
    verifyUserForLoginDto: AuthenticationUserDto,
  ): Promise<ReponseServiceGeneral> {
    return new Promise(async (next) => {
      await this.userModel
        .findOne({ email: verifyUserForLoginDto.email.trim() })
        .then(async (result) => {
          if (result) {
            const state = await compare(
              verifyUserForLoginDto.password,
              result.password,
            );
            if (state) {
              await result.save();
              const {
                fullName,
                _id,
                email,
                prefix,
                number,
                recovery,
                gravatar,
                role,
                companie,
              } = result;

              next({
                etat: true,
                result: {
                  fullName,
                  _id,
                  email,
                  prefix,
                  number,
                  recovery,
                  gravatar,
                  role,
                  companie,
                },
              });
            } else {
              next({
                etat: false,
                error: new Error('Le mot de passe est incorrect'),
              });
            }
          } else {
            next({
              etat: false,
              error: new Error("Ce mail n'appartient à aucun compte"),
            });
          }
        })
        .catch((error) => {
          next({ etat: false, error });
        });
    });
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
