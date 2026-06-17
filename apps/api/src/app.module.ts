import { Module } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import {
  AuthController,
  BusinessController,
  CategoriesController,
  MenuItemsController,
  OrdersController,
  PublicController,
  ReportsController,
  TablesController
} from "./app.controller";
import { JwtAuthGuard } from "./auth.guard";
import { OrdersGateway } from "./orders.gateway";
import { PaymentsService, MockPaymentProvider } from "./payments.service";
import { PrismaService } from "./prisma.service";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100
      }
    ])
  ],
  controllers: [
    AuthController,
    BusinessController,
    CategoriesController,
    MenuItemsController,
    TablesController,
    PublicController,
    OrdersController,
    ReportsController
  ],
  providers: [
    PrismaService,
    JwtAuthGuard,
    OrdersGateway,
    PaymentsService,
    MockPaymentProvider,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}

