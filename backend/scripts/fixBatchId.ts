import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBatchId() {
  try {
    // 这里按系列 ID 给 batchId 赋默认值，你可以根据实际 BoxBatch 表里的 id 调整
    const defaultBatchMap: Record<number, number> = {
      1: 100,  // seriesId: 1 对应 batchId: 100
      2: 101,  // seriesId: 2 对应 batchId: 101
      3: 102,  // seriesId: 3 对应 batchId: 102
    };

    for (const [seriesIdStr, batchId] of Object.entries(defaultBatchMap)) {
      const seriesId = Number(seriesIdStr);

      const updated = await prisma.box.updateMany({
        where: {
          seriesId,
          batchId: null,
        },
        data: {
          batchId,
        },
      });

      console.log(`为 seriesId=${seriesId} 更新了 ${updated.count} 条 batchId`);
    }

    console.log('batchId 修复完成');
  } catch (error) {
    console.error('修复 batchId 失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBatchId();
