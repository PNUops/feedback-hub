/*
  Warnings:

  - You are about to drop the column `closedByAuthor` on the `Feedback` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'WITHDRAWN';

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "closedByAuthor",
ADD COLUMN     "statusBeforeWithdraw" "Status";
