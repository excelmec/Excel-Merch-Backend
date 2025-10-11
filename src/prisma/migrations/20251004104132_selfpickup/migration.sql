-- CreateEnum
CREATE TYPE "public"."SelfpickupStatus" AS ENUM ('not_ready_for_pickup', 'ready_for_pickup', 'picked_up');

-- AlterEnum
ALTER TYPE "public"."OrderStatus" ADD VALUE 'pre_ordered';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "isPreorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSelfPickup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selfpickupStatus" "public"."SelfpickupStatus",
ALTER COLUMN "shippingStatus" DROP NOT NULL;
