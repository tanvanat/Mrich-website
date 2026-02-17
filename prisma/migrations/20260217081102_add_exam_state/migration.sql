-- CreateTable
CREATE TABLE "ExamState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL DEFAULT 'mrich-assessment-v1',
    "attemptToken" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamState_attemptToken_key" ON "ExamState"("attemptToken");

-- CreateIndex
CREATE INDEX "ExamState_formId_updatedAt_idx" ON "ExamState"("formId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExamState_userId_formId_key" ON "ExamState"("userId", "formId");

-- AddForeignKey
ALTER TABLE "ExamState" ADD CONSTRAINT "ExamState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
