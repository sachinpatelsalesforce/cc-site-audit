-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "auditorName" TEXT NOT NULL,
    "auditorEmail" TEXT NOT NULL,
    "opportunity" TEXT,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT NOT NULL DEFAULT '',
    "results" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Audit_shareToken_key" ON "Audit"("shareToken");
