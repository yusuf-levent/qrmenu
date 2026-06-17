import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PayOrderInput, validateSplits } from "@qrmenu/types";
import { PrismaService } from "./prisma.service";

export interface PaymentProvider {
  pay(amountKurus: number): Promise<"PAID" | "FAILED">;
}

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async pay(_amountKurus: number): Promise<"PAID"> {
    return "PAID";
  }
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(MockPaymentProvider)
    private readonly provider: MockPaymentProvider
  ) {}

  async payOrder(orderId: string, input: PayOrderInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });
    if (!order) {
      throw new NotFoundException("Siparis bulunamadi");
    }
    const existingPaid = order.payments
      .filter((payment) => payment.status === "PAID")
      .reduce((sum, payment) => sum + payment.amountKurus, 0);
    if (existingPaid >= order.totalKurus) {
      return this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true, table: true }
      });
    }

    const splits = input.splits?.length
      ? input.splits
      : [{ payerLabel: "Tek odeme", amountKurus: order.totalKurus }];

    if (!validateSplits(order.totalKurus, splits)) {
      throw new BadRequestException("Odeme parcalari toplam tutara esit olmali");
    }

    const splitGroupId = splits.length > 1 ? randomUUID() : null;
    await this.prisma.payment.createMany({
      data: await Promise.all(
        splits.map(async (split) => ({
          orderId,
          amountKurus: split.amountKurus,
          payerLabel: split.payerLabel,
          splitGroupId,
          provider: "MOCK" as const,
          status: await this.provider.pay(split.amountKurus)
        }))
      )
    });

    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, table: true }
    });
  }
}
