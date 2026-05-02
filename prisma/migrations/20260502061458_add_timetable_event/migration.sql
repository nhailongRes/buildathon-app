-- CreateTable
CREATE TABLE "TimetableEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableEvent_userId_startAt_idx" ON "TimetableEvent"("userId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEvent_userId_uid_key" ON "TimetableEvent"("userId", "uid");
