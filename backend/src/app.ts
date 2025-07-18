import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'your_jwt_secret_key'; // 生产环境应使用环境变量

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// 基础路由
app.get('/', (req: Request, res: Response) => {
  res.send('后端服务已启动');
});


// 获取所有系列及其封面信息
app.get('/api/series', async (req: Request, res: Response) => {
  try {
    const seriesList = await prisma.series.findMany();
    res.json(seriesList);
  } catch (error) {
    console.error('获取系列失败:', error);
    res.status(500).json({ error: '获取系列失败' });
  }
});

// 获取所有盲盒
app.get('/api/boxes/latest', async (req: Request, res: Response) => {
  const { seriesId } = req.query;
  const seriesIdNum = Number(seriesId);

  const latestGroup = await prisma.box.findFirst({
    where: { seriesId: seriesIdNum },
    orderBy: { boxGroup: 'desc' },
    select: { boxGroup: true },
  });

  if (!latestGroup?.boxGroup) {
    return res.json([]);
  }

  const boxes = await prisma.box.findMany({
    where: {
      seriesId: seriesIdNum,
      boxGroup: latestGroup.boxGroup,
    },
  });

  res.json(boxes);
});

// 获取某系列的全部盲盒（用于展示系列详情页的普通款 + 隐藏款）
app.get('/api/boxes', async (req: Request, res: Response) => {
  const { seriesId } = req.query;

  const seriesIdNum = Number(seriesId);
  if (!seriesId || isNaN(seriesIdNum)) {
    return res.status(400).json({ error: '缺少或非法的 seriesId 参数' });
  }

  try {
    const boxes = await prisma.box.findMany({
      where: { seriesId: seriesIdNum },
      orderBy: { id: 'asc' },
    });
    res.json(boxes);
  } catch (error) {
    console.error('获取盲盒失败:', error);
    res.status(500).json({ error: '获取盲盒失败' });
  }
});


// 用户注册
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const { username, password }: { username: string; password: string } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });
    
    res.status(201).json({ 
      id: user.id, 
      username: user.username 
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: { username: string; password: string } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    // 查找用户
    const user = await prisma.user.findUnique({ 
      where: { username },
    });
    
    // 验证用户和密码
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '3h' });
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// JWT验证中间件
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未提供认证令牌' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: '无效的认证令牌' });
    if (typeof decoded === 'object' && decoded !== null) {
      req.user = { userId: (decoded as JwtPayload).userId };
      return next();
    } else {
      return res.status(403).json({ error: '认证信息异常' });
    }
  });
}

// 受保护的盲盒抽取路由
app.post('/api/draw', authenticateToken, async (req: Request, res: Response) => {
  const { boxId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: '未认证用户' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: '用户不存在，请重新登录' });
    }

    // 验证盲盒
    const box = await prisma.box.findUnique({ where: { id: boxId } });
    if (!box) {
      return res.status(404).json({ error: '盲盒不存在' });
    }
    if (box.claimed) {
      return res.status(400).json({ error: '该盲盒已被抽取' });
    }

    // 创建抽取记录
    const drawRecord = await prisma.drawRecord.create({
      data: { userId, boxId },
      include: {
        box: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // 更新盲盒状态
    await prisma.box.update({
      where: { id: boxId },
      data: { claimed: true }
    });

    res.json({
      success: true,
      box: drawRecord.box,
      user: drawRecord.user
    });
  } catch (error) {
    console.error('抽取失败:', error);
    res.status(500).json({ error: '抽取失败' });
  }
});

type BoxInput = {
  name: string;
  description: string;
  imageUrl: string;
};

async function generateBlindBoxes(
  prisma: PrismaClient,
  seriesId: number,
  normalBoxes: BoxInput[],
  rareBox: BoxInput
) {
  const totalBoxes = 72; // 6箱 × 12个/箱
  const rareIndex = Math.floor(Math.random() * totalBoxes);
  const allBoxes: any[] = [];

  for (let i = 0; i < totalBoxes / 12; i++) {
    const base8 = [...normalBoxes].sort(() => Math.random() - 0.5).slice(0, 8);
    const repeated = base8.sort(() => Math.random() - 0.5).slice(0, 3);
    const filler = base8[Math.floor(Math.random() * base8.length)];
    const boxGroup = [...base8, ...repeated, filler];

    boxGroup.forEach((box) => {
      allBoxes.push({
        name: '神秘盲盒',
        description: box.description,
        imageUrl: box.imageUrl,
        isRare: false,
        seriesId,
        claimed: false,
        boxGroup: i+1,
      });
    });
  }

  // 插入隐藏款
  allBoxes[rareIndex] = {
    name: '神秘盲盒',
    description: rareBox.description,
    imageUrl: rareBox.imageUrl,
    isRare: true,
    seriesId,
    claimed: false,
    boxGroup: Math.floor(rareIndex / 12) + 1,
  };

  await prisma.box.createMany({ data: allBoxes });
}

//抽取记录
app.get('/api/my-boxes', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: '未认证用户' });
  }

  try {
    const records = await prisma.drawRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        box: {
          include: {
            series: true,
          },
        },
      },
    });

    const result = records.map(record => ({
      id: record.id,
      seriesId: record.box.seriesId,
      seriesName: record.box.series.name,
      boxName: record.box.name,
      description: record.box.description,
      imageUrl: record.box.imageUrl,
      isRare: record.box.isRare,
      drawTime: record.createdAt,
    }));

    res.json(result);
  } catch (error) {
    console.error('获取用户抽取记录失败:', error);
    res.status(500).json({ error: '获取抽取记录失败' });
  }
});


// 初始化数据
async function initializeData() {
  try {
    // 清空现有数据
    await prisma.drawRecord.deleteMany();
    await prisma.box.deleteMany();
    await prisma.series.deleteMany();
    await prisma.user.deleteMany();

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('test123', 10);
    await prisma.user.create({
      data: { 
        username: 'testuser',
        password: hashedPassword
      },
    });

    const nezha = await prisma.series.create({ data: { name: '哪吒系列' } });
    const nailong = await prisma.series.create({ data: { name: '奶龙系列' } });
    const danhuang = await prisma.series.create({ data: { name: '蛋黄猫系列' } });

    await generateBlindBoxes(prisma, nezha.id,
  [
    { name: "哪吒系列1", description: "哪吒", imageUrl: "/img/nz.jpg" },
    { name: "哪吒系列2", description: "敖闰", imageUrl: "/img/ar.jpg" },
    { name: "哪吒系列3", description: "敖丙", imageUrl: "/img/ab.jpg" },
    { name: "哪吒系列4", description: "鹤童", imageUrl: "/img/ht.jpg" },
    { name: "哪吒系列5", description: "申小豹", imageUrl: "/img/sxb.jpg" },
    { name: "哪吒系列6", description: "殷夫人", imageUrl: "/img/yfr.jpg" },
    { name: "哪吒系列7", description: "敖光", imageUrl: "/img/ag.jpg" },
    { name: "哪吒系列8", description: "李靖", imageUrl: "/img/lj.jpg" },
  ],
  { name: "哪吒系列9", description: "灵珠版哪吒", imageUrl: "/img/lzbnz.jpg" }
);

await generateBlindBoxes(prisma, nailong.id,
  [
    { name: "奶龙系列1", description: "飞快奔跑的奶龙", imageUrl: "/img/paobu.gif" },
    { name: "奶龙系列2", description: "会变色的奶龙", imageUrl: "/img/bsl.gif" },
    { name: "奶龙系列3", description: "边躺平边运动的奶龙", imageUrl: "/img/lanqiu.gif" },
    { name: "奶龙系列4", description: "只有眼睛会动的奶龙", imageUrl: "/img/buganshuohua.gif" },
    { name: "奶龙系列5", description: "看到美味食物的奶龙", imageUrl: "/img/chan.gif" },
    { name: "奶龙系列6", description: "跳海草舞的奶龙", imageUrl: "/img/yaohuang.gif" },
    { name: "奶龙系列7", description: "穿着大花袄的奶龙", imageUrl: "/img/dahuaao.gif" },
    { name: "奶龙系列8", description: "诸葛奶龙", imageUrl: "/img/shuijiao.gif" },
  ],
  { name: "奶龙系列9", description: "美若天仙的奶龙", imageUrl: "/img/bianshen.gif" }
);

await generateBlindBoxes(prisma, danhuang.id,
  [
    { name: "蛋黄猫系列1", description: "破🥚壳而出的蛋黄猫", imageUrl: "/img/hi.gif" },
    { name: "蛋黄猫系列2", description: "扮演大圣的蛋黄猫", imageUrl: "/img/swk.gif" },
    { name: "蛋黄猫系列3", description: "因太肥胖而头被卡住的蛋黄猫", imageUrl: "/img/chongya.gif" },
    { name: "蛋黄猫系列4", description: "专心摸🐟的蛋黄猫", imageUrl: "/img/moyu.gif" },
    { name: "蛋黄猫系列5", description: "边听歌🎵边写oj的蛋黄猫", imageUrl: "/img/tingge.gif" },
    { name: "蛋黄猫系列6", description: "展示美妙舞姿的蛋黄猫", imageUrl: "/img/tiaowu.gif" },
    { name: "蛋黄猫系列7", description: "正在嘚瑟地看着你的蛋黄猫", imageUrl: "/img/dese.gif" },
    { name: "蛋黄猫系列8", description: "爱打篮球🏀的蛋黄猫", imageUrl: "/img/dalanqiu.gif" },
  ],
  { name: "蛋黄猫系列9", description: "自信地走着猫步的一颗蛋黄", imageUrl: "/img/jiandan.gif" }
);

    console.log('数据初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

//只在数据表为空时执行初始化
async function initializeDataIfEmpty() {
  const userCount = await prisma.user.count();
  const seriesCount = await prisma.series.count();

  if (userCount === 0 && seriesCount === 0) {
    console.log('数据库为空，正在初始化...');
    await initializeData();
  } else {
    console.log('数据库已存在数据，跳过初始化。');
  }
}

//发帖
app.post('/api/posts', authenticateToken, async (req, res) => {
  const { content, imageUrl } = req.body;
  const userId = req.user?.userId;

  if (!content) {
    return res.status(400).json({ error: '内容不能为空' });
  }

  if (typeof userId !== 'number') {
  return res.status(401).json({ error: '用户未认证' });
}

try {
  const post = await prisma.post.create({
    data: {
      content,
      imageUrl,
      userId,
    }
  });

  res.json(post);
} catch (err) {
  console.error('发帖失败:', err);
  res.status(500).json({ error: '发帖失败' });
}
});

//删帖
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.userId;

    if (isNaN(postId)) {
      return res.status(400).json({ error: '无效的帖子ID' });
    }
    if (!userId) {
      return res.status(401).json({ error: '未认证用户' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: '你无权删除这个帖子' });
    }

    await prisma.post.delete({ where: { id: postId } });
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});


//点赞
app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  const postId = Number(req.params.postId);
  const userId = req.user?.userId;

  const existing = await prisma.like.findFirst({
    where: { postId, userId },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return res.json({ liked: false });
  } else {
    if (typeof userId !== 'number') {
      return res.status(401).json({ error: '用户未认证' });
    }
    await prisma.like.create({ data: { postId, userId } });
    return res.json({ liked: true });
  }
});

//评论
app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  if (!postId) {
    return res.status(400).json({ message: 'Post ID is required' });
  }

  if (!userId) {
    return res.status(401).json({ error: '未登录用户不能评论' });
  }

  if (typeof userId !== 'number') {
    return res.status(401).json({ error: '用户未认证' });
  }

  if (!content) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }

try {
  const comment = await prisma.comment.create({
    data: {
      content,
      post: { connect: { id: Number(postId) } },
      user: { connect: { id: userId } },
    },
    include: { 
      user: true, 
    },
  });

  res.json(comment);
  console.log('评论用户ID:', req.user?.userId);

} catch (err) {
  console.error('评论失败:', err);
  res.status(500).json({ error: '评论失败' });
}
});

//删除评论
app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?.userId;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
    });

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ message: '无权限删除此评论' });
    }

    await prisma.comment.delete({
      where: { id: Number(commentId) },
    });

    res.json({ message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论失败', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

//获取全部帖子（含点赞数、评论数)
app.get('/api/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      likes: true,
      comments: true,
    },
  });

  res.json(posts);
});

//获取评论列表
app.get('/api/posts/:postId/comments', async (req, res) => {
  const postId = Number(req.params.postId);
  const comments = await prisma.comment.findMany({
    where: { postId: Number(postId) },
    orderBy: { createdAt: 'asc' },
    include: { user: true },
  });

  res.json(comments);
});


// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await initializeDataIfEmpty();
  console.log(`服务器运行在 http://localhost:${PORT}`);
});