-- CreateEnum
CREATE TYPE "SelfpickupStatus" AS ENUM ('not_ready_for_pickup', 'ready_for_pickup', 'picked_up');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'pre_ordered';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isPreorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSelfPickup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selfpickupStatus" "SelfpickupStatus",
ALTER COLUMN "shippingStatus" DROP NOT NULL;
