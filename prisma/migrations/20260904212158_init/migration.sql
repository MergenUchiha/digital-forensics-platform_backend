-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "severity" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "locationCity" TEXT,
    "locationCountry" TEXT,
    "locationLat" REAL,
    "locationLng" REAL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "eventsCount" INTEGER NOT NULL DEFAULT 0,
    "suspiciousActivities" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    CONSTRAINT "cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cases_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "originalFilename" TEXT,
    "md5Hash" TEXT,
    "sha256Hash" TEXT,
    "iotDeviceType" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "caseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    CONSTRAINT "evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chain_of_custody" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "signature" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    CONSTRAINT "chain_of_custody_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chain_of_custody_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddresses" TEXT NOT NULL DEFAULT '[]',
    "usernames" TEXT NOT NULL DEFAULT '[]',
    "files" TEXT NOT NULL DEFAULT '[]',
    "devices" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT NOT NULL,
    CONSTRAINT "timeline_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
