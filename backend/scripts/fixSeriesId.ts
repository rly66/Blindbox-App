import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.$executeRawUnsafe(
    `DELETE FROM BoxBatch WHERE seriesId IS NULL`
  );

  console.log(`已删除 ${deleted} 条 seriesId 为 NULL 的 BoxBatch`);

  // 或者用下面这句代替上面一句（用于修复为空的）
  // const updated = await prisma.$executeRawUnsafe(
  //   `UPDATE BoxBatch SET seriesId = 1 WHERE seriesId IS NULL`
  // );
  // console.log(`已更新 ${updated} 条 seriesId 为 NULL 的 BoxBatch`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
