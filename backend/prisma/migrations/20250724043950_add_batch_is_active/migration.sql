-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BoxBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "batchNo" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoxBatch_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BoxBatch" ("batchNo", "createdAt", "id", "seriesId") SELECT "batchNo", "createdAt", "id", "seriesId" FROM "BoxBatch";
DROP TABLE "BoxBatch";
ALTER TABLE "new_BoxBatch" RENAME TO "BoxBatch";
CREATE UNIQUE INDEX "BoxBatch_seriesId_batchNo_key" ON "BoxBatch"("seriesId", "batchNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
