import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type BoxInput = {
  name: string;
  description: string;
  imageUrl: string;
};

// 单箱盲盒生成函数
export async function generateBlindBoxesForBatch(
  prisma: PrismaClient,
  seriesId: number,
  batchNo: number,
  normalBoxes: BoxInput[],
  rareBox: BoxInput | null,
  hasRare: boolean,
  isActive: boolean
) {
  const rareIndexInBatch = hasRare ? Math.floor(Math.random() * 12) : null;

  // 创建批次
  const batch = await prisma.boxBatch.create({
    data: {
      seriesId,
      batchNo,
      isActive,
    },
  });

  // 生成箱内12个盲盒
  // 先随机选8个普通款
  const base8 = [...normalBoxes].sort(() => Math.random() - 0.5).slice(0, 8);
  // 取3个重复款
  const repeated = base8.sort(() => Math.random() - 0.5).slice(0, 3);
  // 1个额外普通款填充
  const filler = base8[Math.floor(Math.random() * base8.length)];
  const boxGroup = [...base8, ...repeated, filler];

  const boxesData: any[] = [];

  for (let i = 0; i < 12; i++) {
    const isRare = rareIndexInBatch !== null && i === rareIndexInBatch;
    const boxInfo = isRare ? rareBox! : boxGroup[i];
    boxesData.push({
      name: '神秘盲盒',
      description: boxInfo.description,
      imageUrl: boxInfo.imageUrl,
      isRare,
      seriesId,
      claimed: false,
      batchId: batch.id,
    });
  }

  await prisma.box.createMany({ data: boxesData });

  return batch;
}

async function initializeData() {
  try {
    await prisma.drawRecord.deleteMany();
    await prisma.box.deleteMany();
    await prisma.boxBatch.deleteMany();
    await prisma.series.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('test123', 10);
    await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
      },
    });

    // 创建系列
    const nezha = await prisma.series.create({ data: { name: '哪吒系列' } });
    const nailong = await prisma.series.create({ data: { name: '奶龙系列' } });
    const danhuangmao = await prisma.series.create({ data: { name: '蛋黄猫系列' } });

    // 哪吒系列
    const nezhaNormalBoxes: BoxInput[] = [
      { name: "哪吒系列1", description: "哪吒", imageUrl: "/img/nz.jpg" },
      { name: "哪吒系列2", description: "敖闰", imageUrl: "/img/ar.jpg" },
      { name: "哪吒系列3", description: "敖丙", imageUrl: "/img/ab.jpg" },
      { name: "哪吒系列4", description: "鹤童", imageUrl: "/img/ht.jpg" },
      { name: "哪吒系列5", description: "申小豹", imageUrl: "/img/sxb.jpg" },
      { name: "哪吒系列6", description: "殷夫人", imageUrl: "/img/yfr.jpg" },
      { name: "哪吒系列7", description: "敖光", imageUrl: "/img/ag.jpg" },
      { name: "哪吒系列8", description: "李靖", imageUrl: "/img/lj.jpg" },
    ];

    const nezhaRareBox: BoxInput = {
      name: "哪吒系列9", description: "灵珠版哪吒", imageUrl: "/img/lzbnz.jpg"
    };

    // 随机选择 1~6 号箱中某一箱放隐藏款
    const nezhaRareBatchNo = Math.floor(Math.random() * 6) + 1;

    for (let batchNo = 1; batchNo <= 6; batchNo++) {
      const hasRare = batchNo === nezhaRareBatchNo;
      const isActive = batchNo === 1; // 仅第1箱初始激活

      await generateBlindBoxesForBatch(
        prisma,
        nezha.id,
        batchNo,
        nezhaNormalBoxes,
        nezhaRareBox,
        hasRare,
        isActive
      );
    }


    // 奶龙系列
    const nailongNormalBoxes: BoxInput[] = [
      { name: "奶龙系列1", description: "飞快奔跑的奶龙", imageUrl: "/img/paobu.gif" },
      { name: "奶龙系列2", description: "会变色的奶龙", imageUrl: "/img/bsl.gif" },
      { name: "奶龙系列3", description: "边躺平边运动的奶龙", imageUrl: "/img/lanqiu.gif" },
      { name: "奶龙系列4", description: "只有眼睛会动的奶龙", imageUrl: "/img/buganshuohua.gif" },
      { name: "奶龙系列5", description: "看到美味食物的奶龙", imageUrl: "/img/chan.gif" },
      { name: "奶龙系列6", description: "跳海草舞的奶龙", imageUrl: "/img/yaohuang.gif" },
      { name: "奶龙系列7", description: "穿着大花袄的奶龙", imageUrl: "/img/dahuaao.gif" },
      { name: "奶龙系列8", description: "诸葛奶龙", imageUrl: "/img/shuijiao.gif" },
    ];

    const nailongRareBox: BoxInput = {
      name: "奶龙系列9", description: "美若天仙的奶龙", imageUrl: "/img/bianshen.gif"
    };

    // 随机选择 1~6 号箱中某一箱放隐藏款
    const nailongRareBatchNo = Math.floor(Math.random() * 6) + 1;

    for (let batchNo = 1; batchNo <= 6; batchNo++) {
      const hasRare = batchNo === nailongRareBatchNo;
      const isActive = batchNo === 1; // 仅第1箱初始激活

      await generateBlindBoxesForBatch(
        prisma,
        nailong.id,
        batchNo,
        nailongNormalBoxes,
        nailongRareBox,
        hasRare,
        isActive
      );
    }

    // 蛋黄猫系列
    const dhmNormalBoxes: BoxInput[] = [
      { name: "蛋黄猫系列1", description: "破🥚壳而出的蛋黄猫", imageUrl: "/img/hi.gif" },
      { name: "蛋黄猫系列2", description: "扮演大圣的蛋黄猫", imageUrl: "/img/swk.gif" },
      { name: "蛋黄猫系列3", description: "因太肥胖而头被卡住的蛋黄猫", imageUrl: "/img/chongya.gif" },
      { name: "蛋黄猫系列4", description: "专心摸🐟的蛋黄猫", imageUrl: "/img/moyu.gif" },
      { name: "蛋黄猫系列5", description: "边听歌🎵边写oj的蛋黄猫", imageUrl: "/img/tingge.gif" },
      { name: "蛋黄猫系列6", description: "展示美妙舞姿的蛋黄猫", imageUrl: "/img/tiaowu.gif" },
      { name: "蛋黄猫系列7", description: "正在嘚瑟地看着你的蛋黄猫", imageUrl: "/img/dese.gif" },
      { name: "蛋黄猫系列8", description: "爱打篮球🏀的蛋黄猫", imageUrl: "/img/dalanqiu.gif" },
    ];

    const dhmRareBox: BoxInput = {
      name: "蛋黄猫系列9", description: "自信地走着猫步的一颗蛋黄", imageUrl: "/img/jiandan.gif"
    };

    // 随机选择 1~6 号箱中某一箱放隐藏款
    const dhmRareBatchNo = Math.floor(Math.random() * 6) + 1;

    for (let batchNo = 1; batchNo <= 6; batchNo++) {
      const hasRare = batchNo === dhmRareBatchNo;
      const isActive = batchNo === 1; // 仅第1箱初始激活

      await generateBlindBoxesForBatch(
        prisma,
        danhuangmao.id,
        batchNo,
        dhmNormalBoxes,
        dhmRareBox,
        hasRare,
        isActive
      );
    }

    console.log('数据初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initializeData();
}
