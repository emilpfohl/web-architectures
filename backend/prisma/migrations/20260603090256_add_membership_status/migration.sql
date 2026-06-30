-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Membership" (
    "userId" INTEGER NOT NULL,
    "wgId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "isHome" BOOLEAN NOT NULL DEFAULT true,
    "mood" TEXT NOT NULL DEFAULT 'Chill',

    PRIMARY KEY ("userId", "wgId"),
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Membership_wgId_fkey" FOREIGN KEY ("wgId") REFERENCES "WG" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Membership" ("role", "userId", "wgId") SELECT "role", "userId", "wgId" FROM "Membership";
DROP TABLE "Membership";
ALTER TABLE "new_Membership" RENAME TO "Membership";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
