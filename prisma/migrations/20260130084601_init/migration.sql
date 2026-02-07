-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);
