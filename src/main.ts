import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { TransformErrorInStringInterceptor } from './Interceptors/ToResponse/Transform.result.in.jwt';
import 'dotenv/config';

const server = express();
const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
    {
      snapshot: true,
    },
  );
  //app.use(compression());
  app.useStaticAssets(join(__dirname, '../static/assets')); // static File Folder

  //app.setBaseViewsDir(join(__dirname, '..', 'views'));

  app.setViewEngine('ejs');
  app.use(bodyParser.json({ limit: '100mb' })); // enable bodyParser with great Limit
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true })); // encoded bodyParser with great Limit
  app.use(helmet());
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformErrorInStringInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Welcome To Documentation')
    .setDescription('The mini API description')
    .setVersion('1.0')
    //.addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docWelcome', app, document);

  await app.listen(process.env.APP_PORT.toString(), () => {
    logger.verbose(
      `HTTP SERVICE READY... ${process.env.APP_HOST}:${process.env.APP_PORT}`,
    );
  });
}
bootstrap();
