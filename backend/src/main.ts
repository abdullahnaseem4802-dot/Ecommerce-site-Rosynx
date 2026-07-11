import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes prefixed with /api/v1
  app.setGlobalPrefix('api/v1');

  // Validate & strip unknown properties on every DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Allow the storefront + admin panel to call this API
  const origins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://localhost:4001'
  )
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ROSYNX API running on http://localhost:${port}/api/v1`);
}
bootstrap();
