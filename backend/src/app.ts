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
app.get('/api/boxes/latest', async (req, res) => {
  const seriesId = parseInt(req.query.seriesId as string);
  if (!seriesId) return res.status(400).json({ message: '缺少 seriesId 参数' });

  const activeBatch = await prisma.boxBatch.findFirst({
    where: { seriesId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeBatch) return res.status(404).json({ message: '该系列尚未上架任何盲盒' });

  const boxes = await prisma.box.findMany({
    where: { batchId: activeBatch.id },
    orderBy: { id: 'asc' },
  });

  res.json({ boxes });
});

// 创建一箱 12 个盲盒（包含一个隐藏款的概率为 1/72）
async function generateBlindBoxesForBatch(seriesId: number, batchId: number) {
  const characters = await prisma.box.findMany({
    where: { seriesId },
  });

  const normalCharacters = characters.filter((c) => !c.isRare);
  const hiddenCharacters = characters.filter((c) => c.isRare);

  // 选择 5 个不重复的普通角色
  const shuffled = [...normalCharacters].sort(() => Math.random() - 0.5);
  const selected5 = shuffled.slice(0, 5);

  // 从这5个中随机3个重复一次，组成 5+3=8
  const repeated = selected5.sort(() => Math.random() - 0.5).slice(0, 3);
  const normalBoxCharacters = [...selected5, ...repeated];

  // 添加隐藏款（仅 1/72 概率）
  const hiddenBoxIncluded = Math.random() < 1 / 72;
  if (hiddenBoxIncluded && hiddenCharacters.length > 0) {
    const hiddenOne =
      hiddenCharacters[Math.floor(Math.random() * hiddenCharacters.length)];
    normalBoxCharacters.push(hiddenOne);
  }

  // 填满到12个（剩下的补普通款）
  while (normalBoxCharacters.length < 12) {
    const extra =
      normalCharacters[Math.floor(Math.random() * normalCharacters.length)];
    normalBoxCharacters.push(extra);
  }

  // 随机打乱顺序
  normalBoxCharacters.sort(() => Math.random() - 0.5);

  // 返回用于创建的盲盒数据
  return normalBoxCharacters.map((char) => ({
    name: char.name,
    description: char.description,
    imageUrl: char.imageUrl,
    isHidden: char.isRare,
    claimed: false,
    seriesId,
    batchId,
  }));
}


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
      select: {
        id: true,
        username: true,
        password: true,
        isAdmin: true,
      },
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
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前登录用户信息
app.get('/api/me', authenticateToken, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: '未认证用户' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息失败', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// JWT验证中间件
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未提供认证令牌' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: '无效的认证令牌' });
    if (typeof decoded === 'object' && decoded !== null) {
      const userId = (decoded as JwtPayload).userId;
      // 查询数据库用户
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(403).json({ error: '用户不存在' });

      // 把完整用户信息挂到请求
      req.user = { userId: user.id, ...user };
      next();
    } else {
      return res.status(403).json({ error: '认证信息异常' });
    }
  });

  console.log('Authorization Header:', req.headers['authorization']);

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

//只在数据表为空时执行初始化
async function initializeDataIfEmpty() {
  const userCount = await prisma.user.count();
  const seriesCount = await prisma.series.count();

  if (userCount === 0 && seriesCount === 0) {
    console.log('数据库为空，正在初始化...');
    await import('../scripts/initData');
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

// 管理员后台操作
// 1.获取所有系列与对应箱子状态
app.get('/api/admin/batches/status', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: '无权访问，管理员权限不足' });
  }

  try {
    const seriesList = await prisma.series.findMany({
      include: {
        batches: {
          include: {
            boxes: true,
          },
        },
      },
    });

    const result = seriesList.map((series) => {
      const batches = series.batches.map((batch) => {
        const total = batch.boxes.length;
        const claimed = batch.boxes.filter((b) => b.claimed).length;
        const isFinished = claimed >= total;

        return {
          batchId: batch.id,
          batchNo: batch.batchNo,
          total,
          claimed,
          isFinished,
          isActive: batch.isActive
        };
      });

      return {
        seriesId: series.id,
        seriesName: series.name,
        batches,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取箱子状态失败' });
  }
});

// 2.查看所有抽取记录
app.get('/api/admin/draw-records', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: '无权访问，管理员权限不足' });
  }

  try {
    const records = await prisma.drawRecord.findMany({
      include: {
        user: { select: { id: true, username: true } },
        box: {
          include: {
            series: true,
          },
    },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = records.map((r) => ({
      username: r.user.username,
      boxName: r.box.name,
      description: r.box.description,
      seriesName: r.box.series.name,
      isRare: r.box.isRare,
      drawTime: r.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取抽取记录失败' });
  }
});

// 3.上架新箱子
app.post('/api/admin/batch/activate', async (req, res) => {
  const { seriesId } = req.body;

  // 找到当前正在上架的箱子
  const current = await prisma.boxBatch.findFirst({
    where: { seriesId, isActive: true },
    orderBy: { batchNo: 'asc' },
  });

  // 检查是否被抽完
  const total = await prisma.box.count({ where: { batchId: current?.id } });
  const claimed = await prisma.box.count({ where: { batchId: current?.id, claimed: true } });
  if (claimed < total) {
    return res.status(400).json({ error: '当前箱子还未抽完，不能上架下一箱' });
  }

  // 将当前设为 inactive
  await prisma.boxBatch.update({
    where: { id: current?.id },
    data: { isActive: false },
  });

  // 找到下一箱
  const nextBatch = await prisma.boxBatch.findFirst({
    where: {
      seriesId,
      isActive: false,
      batchNo: { gt: current?.batchNo },
    },
    orderBy: { batchNo: 'asc' },
  });

  if (!nextBatch) {
    return res.status(400).json({ error: '没有更多的箱子可上架' });
  }

  // 上架下一箱
  await prisma.boxBatch.update({
    where: { id: nextBatch.id },
    data: { isActive: true },
  });

  return res.json({ message: `成功上架第 ${nextBatch.batchNo} 箱` });
});


// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await initializeDataIfEmpty();
  console.log(`服务器运行在 http://localhost:${PORT}`);
});