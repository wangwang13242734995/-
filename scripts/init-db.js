/**
 * Database initialization script for Railway/production deployment.
 * Creates tables via raw SQL if they don't exist (based on Prisma schema).
 * Called at container startup before the Next.js server starts.
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

// Ensure data directory exists
const dataDir = process.env.DATABASE_URL
  ? path.dirname(process.env.DATABASE_URL.replace("file:", "")).replace(/\\/g, "/")
  : "/app/data";
if (dataDir && !fs.existsSync(dataDir)) {
  try { fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 }); } catch(e) { /* ignore */ }
}
console.log("DATABASE_URL:", process.env.DATABASE_URL || "NOT SET");
console.log("Data dir:", dataDir);

const prisma = new PrismaClient();

async function ensureTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'STUDENT',
      "avatar" TEXT,
      "school" TEXT,
      "major" TEXT,
      "graduationYear" INTEGER,
      "bio" TEXT,
      "skills" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Project" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "teamSize" INTEGER NOT NULL DEFAULT 1,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME,
      "techStack" TEXT NOT NULL DEFAULT '[]',
      "description" TEXT NOT NULL,
      "difficulty" TEXT,
      "outcome" TEXT,
      "outcomeType" TEXT NOT NULL DEFAULT 'NONE',
      "outcomeData" TEXT,
      "difficultyEncountered" TEXT,
      "solution" TEXT,
      "githubLink" TEXT,
      "designLink" TEXT,
      "videoLink" TEXT,
      "liveLink" TEXT,
      "attachments" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "credibilityScore" INTEGER NOT NULL DEFAULT 0,
      "problemAnalysis" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "AbilityScore" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "craft" REAL NOT NULL DEFAULT 30,
      "learn" REAL NOT NULL DEFAULT 30,
      "drive" REAL NOT NULL DEFAULT 30,
      "team" REAL NOT NULL DEFAULT 30,
      "grit" REAL NOT NULL DEFAULT 30,
      "express" REAL NOT NULL DEFAULT 30,
      "totalScore" REAL NOT NULL DEFAULT 30,
      "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "GrowthRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "projectId" TEXT,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "abilitySignals" TEXT NOT NULL DEFAULT '[]',
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "WeeklyReport" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "weekStart" DATETIME NOT NULL,
      "weekEnd" DATETIME NOT NULL,
      "recordCount" INTEGER NOT NULL DEFAULT 0,
      "abilityChanges" TEXT NOT NULL DEFAULT '{}',
      "hoursInvested" REAL NOT NULL DEFAULT 0,
      "aiSuggestion" TEXT,
      "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "TimeCapsule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "goal" TEXT NOT NULL,
      "writtenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "openDates" TEXT NOT NULL DEFAULT '[]',
      "openedAt" DATETIME,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Enterprise" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL UNIQUE,
      "companyName" TEXT NOT NULL,
      "logo" TEXT,
      "industry" TEXT,
      "companySize" TEXT,
      "creditCode" TEXT,
      "legalPerson" TEXT,
      "verificationLevel" TEXT NOT NULL DEFAULT 'BASIC',
      "description" TEXT,
      "website" TEXT,
      "contactPerson" TEXT,
      "contactPosition" TEXT,
      "contactEmail" TEXT,
      "address" TEXT,
      "recruitingNeeds" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "rejectReason" TEXT,
      "verifiedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Challenge" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "enterpriseId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "requirements" TEXT,
      "maxParticipants" INTEGER NOT NULL DEFAULT 100,
      "duration" INTEGER NOT NULL DEFAULT 14,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "rewardType" TEXT NOT NULL DEFAULT 'CERTIFICATE',
      "rewardDetail" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "ChallengeParticipation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "challengeId" TEXT NOT NULL,
      "submission" TEXT,
      "links" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      "submittedAt" DATETIME,
      "reviewedAt" DATETIME,
      "feedback" TEXT,
      "rank" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Credential" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "issuer" TEXT NOT NULL,
      "description" TEXT,
      "verifyCode" TEXT NOT NULL UNIQUE,
      "verifyUrl" TEXT,
      "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId")`,
    `CREATE INDEX IF NOT EXISTS "AbilityScore_userId_idx" ON "AbilityScore"("userId")`,
    `CREATE INDEX IF NOT EXISTS "GrowthRecord_userId_idx" ON "GrowthRecord"("userId")`,
    `CREATE INDEX IF NOT EXISTS "GrowthRecord_projectId_idx" ON "GrowthRecord"("projectId")`,
    `CREATE INDEX IF NOT EXISTS "WeeklyReport_userId_idx" ON "WeeklyReport"("userId")`,
    `CREATE INDEX IF NOT EXISTS "TimeCapsule_userId_idx" ON "TimeCapsule"("userId")`,
    `CREATE INDEX IF NOT EXISTS "Challenge_enterpriseId_idx" ON "Challenge"("enterpriseId")`,
    `CREATE INDEX IF NOT EXISTS "Challenge_status_idx" ON "Challenge"("status")`,
    `CREATE INDEX IF NOT EXISTS "ChallengeParticipation_challengeId_idx" ON "ChallengeParticipation"("challengeId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ChallengeParticipation_userId_challengeId_key" ON "ChallengeParticipation"("userId", "challengeId")`,
    `CREATE INDEX IF NOT EXISTS "Credential_userId_idx" ON "Credential"("userId")`,
    // Migration: add new Enterprise columns for pre-existing tables (SQLite ignores duplicate-column errors)
    `ALTER TABLE "Enterprise" ADD COLUMN "companySize" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "contactPerson" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "contactPosition" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "contactEmail" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "address" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "recruitingNeeds" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "creditCode" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "legalPerson" TEXT`,
    `ALTER TABLE "Enterprise" ADD COLUMN "verificationLevel" TEXT NOT NULL DEFAULT 'BASIC'`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      // Ignore "already exists" and "duplicate column" errors (idempotent migration)
      if (!e.message.includes("already exists") && !e.message.includes("duplicate column")) {
        console.warn("SQL warning:", e.message.slice(0, 100));
      }
    }
  }

  console.log("Database tables ensured successfully");
}

// Idempotently provision the platform admin account so the review backend is usable
// on a fresh deployment. Override via ADMIN_EMAIL / ADMIN_PASSWORD env in production.
async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@test.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  // Precomputed bcrypt hash of the default password "admin123456". Used as a fallback
  // when bcryptjs is unavailable in the standalone runtime image.
  const DEFAULT_HASH = "$2b$10$b2DYpeRmEYp1AmcJXofh3eqJKeNiNamvOjTi7awgrVc3vN72ig66C";
  let hash = DEFAULT_HASH;
  try {
    const bcrypt = require("bcryptjs");
    hash = await bcrypt.hash(password, 10);
  } catch (e) {
    if (password !== "admin123456") {
      console.warn("ADMIN_PASSWORD is set but bcryptjs unavailable; admin password will fall back to default.");
    }
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role !== "ADMIN") {
        await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
        console.log("Admin role promoted for", email);
      }
      return;
    }
    await prisma.user.create({
      data: { name: "平台管理员", email, password: hash, role: "ADMIN" },
    });
    console.log("Admin account created:", email);
  } catch (e) {
    console.warn("ensureAdmin skipped:", e.message.slice(0, 100));
  }
}

ensureTables()
  .then(() => ensureAdmin())
  .then(() => ensureDemo())
  .catch((e) => {
    console.error("DB init error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// Seed demo data (enterprise/students/challenges) so the app is usable out of the box.
// Isolated in try/catch: a seed failure must never block tables/admin or container boot.
async function ensureDemo() {
  if (process.env.SEED_DEMO === "0" || process.env.SEED_DEMO === "false") {
    console.log("Demo seed skipped (SEED_DEMO disabled)");
    return;
  }
  try {
    const { seedDemo } = require("./seed-demo");
    await seedDemo(prisma);
  } catch (e) {
    console.warn("ensureDemo skipped:", e.message.slice(0, 160));
  }
}
