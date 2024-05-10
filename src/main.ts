import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { AuthGuard } from './common/guards/auth/auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      whitelist: true,
    }),
  );
  app.useGlobalGuards(new AuthGuard());
  await app.listen(3000);
}
bootstrap();
