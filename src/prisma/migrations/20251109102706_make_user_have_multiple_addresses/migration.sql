/*
  Warnings:

  - The primary key for the `CartItem` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterEnum
ALTER TYPE "merch_backend"."OrderStatus" ADD VALUE 'partially_fullfilled';

-- DropIndex
DROP INDEX "merch_backend"."Address_userId_key";

-- AlterTable
ALTER TABLE "merch_backend"."CartItem" DROP CONSTRAINT "CartItem_pkey",
ADD COLUMN     "addressId" INTEGER,
ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY ("itemId", "userId", "sizeOption");

-- AlterTable
ALTER TABLE "merch_backend"."OrderItem" ADD COLUMN     "fulfilledQuantity" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "merch_backend"."CartItem" ADD CONSTRAINT "CartItem_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "merch_backend"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
