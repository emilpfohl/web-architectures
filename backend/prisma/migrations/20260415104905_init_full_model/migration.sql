-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WG" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Membership" (
    "userId" INTEGER NOT NULL,
    "wgId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,

    PRIMARY KEY ("userId", "wgId"),
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Membership_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    CONSTRAINT "ShoppingItem_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wgId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Todo_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Todo_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wgId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "CalendarEvent_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wgId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "paidById" INTEGER NOT NULL,
    CONSTRAINT "FinanceItem_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinanceItem_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wgId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL,
    CONSTRAINT "Invitation_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wgId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" INTEGER,
    "timestamp" TEXT NOT NULL,
    CONSTRAINT "Message_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
