/*
  Warnings:

  - You are about to drop the column `isPreorder` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "merch_backend"."Order" DROP COLUMN "isPreorder";

-- AlterTable
ALTER TABLE "merch_backend"."OrderItem" ADD COLUMN     "isPreorder" BOOLEAN NOT NULL DEFAULT false;
