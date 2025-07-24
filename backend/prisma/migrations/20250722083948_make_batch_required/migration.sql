/*
  Warnings:

  - Made the column `batchId` on table `Box` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Box" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "isRare" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Box_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Box_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BoxBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "BoxBatch" ("id", "batchNo", "seriesId") VALUES (100, 1, 1);
INSERT INTO "BoxBatch" ("id", "batchNo", "seriesId") VALUES (101, 1, 2);
INSERT INTO "BoxBatch" ("id", "batchNo", "seriesId") VALUES (102, 1, 3);

INSERT INTO "new_Box" ("batchId", "claimed", "createdAt", "description", "id", "imageUrl", "isRare", "name", "seriesId") SELECT "batchId", "claimed", "createdAt", "description", "id", "imageUrl", "isRare", "name", "seriesId" FROM "Box";
DROP TABLE "Box";
ALTER TABLE "new_Box" RENAME TO "Box";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
