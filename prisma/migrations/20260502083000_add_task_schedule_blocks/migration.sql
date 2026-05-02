CREATE TABLE "TaskScheduleBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskScheduleBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskScheduleBlock_userId_startAt_idx" ON "TaskScheduleBlock"("userId", "startAt");

CREATE INDEX "TaskScheduleBlock_taskId_startAt_idx" ON "TaskScheduleBlock"("taskId", "startAt");

ALTER TABLE "TaskScheduleBlock" ADD CONSTRAINT "TaskScheduleBlock_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
