-- CreateTable
CREATE TABLE "operation_logs" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "args" JSONB,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operation_logs_status_idx" ON "operation_logs"("status");

-- CreateIndex
CREATE INDEX "operation_logs_startedAt_idx" ON "operation_logs"("startedAt");
