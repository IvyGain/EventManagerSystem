-- CreateTable
CREATE TABLE "EventEmailSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "qrSubject" TEXT,
    "qrGreeting" TEXT,
    "qrMainMessage" TEXT,
    "qrInstructions" TEXT,
    "qrFooter" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "reminderSubject" TEXT,
    "reminderMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventEmailSettings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    CONSTRAINT "EmailLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EventEmailSettings_eventId_key" ON "EventEmailSettings"("eventId");

-- CreateIndex
CREATE INDEX "EmailLog_participantId_idx" ON "EmailLog"("participantId");

-- CreateIndex
CREATE INDEX "EmailLog_type_idx" ON "EmailLog"("type");
