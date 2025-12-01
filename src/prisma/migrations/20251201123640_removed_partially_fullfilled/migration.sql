/*
  Warnings:

  - The values [partially_fullfilled] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "merch_backend"."OrderStatus_new" AS ENUM ('order_unconfirmed', 'order_confirmed', 'order_cancelled_by_user', 'order_cancelled_insufficient_stock', 'pre_ordered');
ALTER TABLE "merch_backend"."Order" ALTER COLUMN "orderStatus" TYPE "merch_backend"."OrderStatus_new" USING ("orderStatus"::text::"merch_backend"."OrderStatus_new");
ALTER TYPE "merch_backend"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "merch_backend"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "merch_backend"."OrderStatus_old";
COMMIT;
