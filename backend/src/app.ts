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
      user?: { userId: number };
    }
  }
}

app.use(cors());
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
app.get('/api/boxes', async (req: Request, res: Response) => {
  const { seriesId } = req.query;

  try {
    if (!seriesId) {
      return res.status(400).json({ error: '缺少 seriesId 参数' });
    }

    const seriesIdNumber = Number(seriesId);
    if (isNaN(seriesIdNumber)) {
      return res.status(400).json({ error: 'seriesId 参数无效' });
    }

    const boxes = await prisma.box.findMany({
      where: {
        seriesId: Number(seriesId),
      },
    });

console.log('seriesId:', seriesId);

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
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    
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
    }
    next();
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

// 初始化数据
async function initializeData() {
  try {
    // 清空现有数据
    await prisma.drawRecord.deleteMany();
    await prisma.box.deleteMany();
    await prisma.user.deleteMany();
    await prisma.series.deleteMany();

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

    // 创建9个盲盒
    await prisma.box.createMany({ 
      data: [
      { name: "神秘盲盒 #1", description: "哪吒", imageUrl: "/img/nz.jpg",  seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #2", description: "敖闰", imageUrl: "/img/ar.jpg", seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #3", description: "敖丙", imageUrl: "/img/ab.jpg", seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #4", description: "鹤童", imageUrl: "/img/ht.jpg", seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #5", description: "灵珠版哪吒", imageUrl: "/img/lzbnz.jpg", seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #6", description: "殷夫人", imageUrl: "/img/yfr.jpg", seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #7", description: "敖光", imageUrl: "/img/ag.jpg", seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #8", description: "李靖", imageUrl: "/img/lj.jpg", seriesId: nezha.id, claimed: false },
      { name: "神秘盲盒 #9", description: "申小豹", imageUrl: "/img/sxb.jpg", seriesId: nezha.id, claimed: false } 
      ]
    });

    await prisma.box.createMany({ 
      data: [
      { name: "神秘盲盒 #1", description: "飞快奔跑的奶龙", imageUrl: "/img/paobu.gif",  seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #2", description: "会变色的奶龙", imageUrl: "/img/bsl.gif", seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #3", description: "边躺平边运动的奶龙", imageUrl: "/img/lanqiu.gif", seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #4", description: "会美瞎你的奶龙", imageUrl: "/img/bianshen.gif", seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #5", description: "看到美味食物的奶龙", imageUrl: "/img/chan.gif", seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #6", description: "跳海草舞的奶龙", imageUrl: "/img/yaohuang.gif", seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #7", description: "穿着大花袄的奶龙", imageUrl: "/img/dahuaao.gif", seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #8", description: "教你“人生道理”的诸葛奶龙", imageUrl: "/img/shuijiao.gif", seriesId: nailong.id, claimed: false },
      { name: "神秘盲盒 #9", description: "只有眼睛会动的奶龙", imageUrl: "/img/buganshuohua.gif", seriesId: nailong.id, claimed: false } 
      ]
    });

    await prisma.box.createMany({ 
      data: [
      { name: "神秘盲盒 #1", description: "破🥚壳而出的蛋黄猫", imageUrl: "/img/hi.gif",  seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #2", description: "扮演大圣的蛋黄猫", imageUrl: "/img/swk.gif", seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #3", description: "因太肥胖而头被卡住的蛋黄猫", imageUrl: "/img/chongya.gif", seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #4", description: "专心摸🐟的蛋黄猫", imageUrl: "/img/moyu.gif", seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #5", description: "自信地走着猫步的一颗蛋黄", imageUrl: "/img/jiandan.gif", seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #6", description: "边听歌🎵边写oj的蛋黄猫", imageUrl: "/img/tingge.gif", seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #7", description: "正在嘚瑟地看着你的蛋黄猫", imageUrl: "/img/dese.gif", seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #8", description: "爱打篮球🏀的蛋黄猫", imageUrl: "/img/dalanqiu.gif", seriesId: danhuang.id, claimed: false },
      { name: "神秘盲盒 #9", description: "展示美妙舞姿的蛋黄猫", imageUrl: "/img/tiaowu.gif", seriesId: danhuang.id, claimed: false } 
      ]
    });

    console.log('数据初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await initializeData();
  console.log(`服务器运行在 http://localhost:${PORT}`);
});