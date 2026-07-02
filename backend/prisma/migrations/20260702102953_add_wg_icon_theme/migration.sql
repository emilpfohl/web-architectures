-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WG" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🏠',
    "themeColor" TEXT NOT NULL DEFAULT '#50644e'
);
INSERT INTO "new_WG" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "WG";
DROP TABLE "WG";
ALTER TABLE "new_WG" RENAME TO "WG";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
