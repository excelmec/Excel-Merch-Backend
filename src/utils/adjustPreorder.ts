import { prisma } from "./prisma";
import { OrderStatus } from "@prisma/client";

export async function adjustPreorders(itemId: number) {
  try {
    // Use a transaction for the entire operation
    await prisma.$transaction(async (tx) => {
      // 1. Get all preorders for this item, oldest first
      const preorders = await tx.order.findMany({
        where: {
          orderStatus: {
            in: [OrderStatus.pre_ordered, OrderStatus.partially_fullfilled],
          },
          orderItems: {
            some: {
              isPreorder: true,
              itemId,
              // Only consider items that aren't fully fulfilled
              fulfilledQuantity: { lt: prisma.orderItem.fields.quantity },
            },
          },
        },
        include: {
          orderItems: {
            where: {
              itemId,
              fulfilledQuantity: { lt: prisma.orderItem.fields.quantity },
            },
          },
        },
        orderBy: { orderDate: "asc" },
      });

      // 2. Get current stock counts for all variants at once
      const stockCounts = await tx.stockCount.findMany({
        where: { itemId },
      });

      // Create a map for easy access
      const stockMap = new Map();
      stockCounts.forEach((stock) => {
        const key = `${stock.colorOption}-${stock.sizeOption}`;
        stockMap.set(key, stock);
      });

      // 3. Process each preorder
      for (const order of preorders) {
        let fullyFulfilled = true;

        for (const orderItem of order.orderItems) {
          if (orderItem.itemId !== itemId) continue;

          // Calculate remaining quantity
          const remainingQty =
            orderItem.quantity - (orderItem.fulfilledQuantity || 0);
          if (remainingQty <= 0) continue;

          // Get current stock for this variant
          const stockKey = `${orderItem.colorOption}-${orderItem.sizeOption}`;
          const stock = stockMap.get(stockKey);

          if (!stock || stock.count <= 0) {
            fullyFulfilled = false;
            continue;
          }

          const fulfillNow = Math.min(stock.count, remainingQty);

          // Update the order item
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: {
              fulfilledQuantity:
                (orderItem.fulfilledQuantity || 0) + fulfillNow,
            },
          });

          // Update stock in our map and database
          const newStockCount = stock.count - fulfillNow;
          stockMap.set(stockKey, { ...stock, count: newStockCount });

          await tx.stockCount.update({
            where: {
              itemId_colorOption_sizeOption: {
                itemId,
                colorOption: stock.colorOption,
                sizeOption: stock.sizeOption,
              },
            },
            data: { count: newStockCount },
          });

          if (fulfillNow < remainingQty) {
            fullyFulfilled = false;
          }
        }

        const newStatus = fullyFulfilled
            ? OrderStatus.order_confirmed
            : OrderStatus.pre_ordered

        await tx.order.update({
          where: { orderId: order.orderId },
          data: { orderStatus: newStatus },
        });
      }
    });

    console.log(`Successfully processed preorders for item ${itemId}`);
  } catch (error) {
    console.error(`Error processing preorders for item ${itemId}:`, error);
    throw error;
  }
}
