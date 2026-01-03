import { prisma } from "./prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function adjustPreorders(itemId: number) {
  await prisma.$transaction(async (tx) => {
    const preorders = await tx.order.findMany({
      where: {
        paymentStatus: PaymentStatus.payment_received,
        orderStatus: OrderStatus.pre_ordered,
        orderItems: {
          some: {
            isPreorder: true,
            itemId,
          },
        },
      },
      include: {
        orderItems: {
          where: {
            itemId,
            isPreorder: true,
          },
        },
      },
      orderBy: { orderDate: "asc" },
    });

    const stockCounts = await tx.stockCount.findMany({
      where: { itemId },
    });

    const stockMap = new Map<string, number>();
    stockCounts.forEach((s) => {
      stockMap.set(`${s.colorOption}-${s.sizeOption}`, s.count);
    });

    for (const order of preorders) {
      // Fulfill preorder items for THIS itemId
      for (const orderItem of order.orderItems) {
        const remainingQty =
          orderItem.quantity - orderItem.fulfilledQuantity;

        if (remainingQty <= 0) continue;

        const key = `${orderItem.colorOption}-${orderItem.sizeOption}`;
        const availableStock = stockMap.get(key) ?? 0;

        if (availableStock <= 0) continue;

        const fulfillNow = Math.min(availableStock, remainingQty);

        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            fulfilledQuantity:
              orderItem.fulfilledQuantity + fulfillNow,
          },
        });

        stockMap.set(key, availableStock - fulfillNow);

        await tx.stockCount.update({
          where: {
            itemId_colorOption_sizeOption: {
              itemId,
              colorOption: orderItem.colorOption,
              sizeOption: orderItem.sizeOption,
            },
          },
          data: { count: availableStock - fulfillNow },
        });
      }

      // RECHECK ENTIRE ORDER (ALL preorder items)
      const allPreorderItems = await tx.orderItem.findMany({
        where: {
          orderId: order.orderId,
          isPreorder: true,
        },
        select: {
          quantity: true,
          fulfilledQuantity: true,
        },
      });

      const hasPending = allPreorderItems.some(
        (oi) => oi.fulfilledQuantity < oi.quantity
      );

      await tx.order.update({
        where: { orderId: order.orderId },
        data: {
          orderStatus: hasPending
            ? OrderStatus.pre_ordered
            : OrderStatus.order_confirmed,
        },
      });
    }
  });

}
