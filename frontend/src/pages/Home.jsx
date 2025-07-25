import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Home({ user }) {
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const seriesMetadata = {
    '哪吒系列': {
      description: '集结《哪吒》全明星阵容！解锁你的专属神话天团～',
      coverImage: '/series/nezha.jpg',
    },
    '奶龙系列': {
      description: '奶龙驾到，萌力全开！抽一只圆滚滚的治愈小恶龙，拯救你的不开心~',
      coverImage: '/series/nailong.jpg',
    },
    '蛋黄猫系列': {
      description: '魔性表情包本体登场！解锁小戏精贱萌日常，承包你的快乐收藏～',
      coverImage: '/series/dhm.png',
    },
  };

  const filteredSeries = seriesList.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  useEffect(() => {
    async function fetchSeries() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/series`);
        const mergedSeries = res.data.map(series => {
        const cleanName = series.name.trim(); // 去除空格或换行
        return {
          ...series,
          ...seriesMetadata[cleanName],
        };
      });
        setSeriesList(mergedSeries);
      } catch (error) {
        console.error('加载系列失败:', error);
      } finally {
      setLoading(false);
      }
    }

    fetchSeries();
  }, []);

  const handleSeriesClick = (seriesId, seriesName) => {
    navigate(`/series/${seriesId}`, {
      state: { seriesName },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('blindBoxToken');
    localStorage.removeItem('blindBoxUser');
    navigate(0);
  };

  return (
    <div className="p-6">
      {/* 顶部欢迎区 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-indigo-700" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>盲盒首页</h1>
        <div className="flex items-center space-x-4">
          {/* 搜索框 */}
          <input type="text" placeholder="搜索系列名称" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <span className="text-gray-700">欢迎，{user?.username}</span>
          <button
            onClick={handleLogout}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 系列盲盒展示区 */}
      <h2 className="text-xl font-semibold mb-4 text-indigo-500 animate-bounce" style={{ fontFamily: '"STXingkai", "华文行楷", cursive' }}>》〉选择你心仪的系列开启盲盒之旅吧！</h2>
      <div className="grid grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400">正在加载盲盒系列...</p>
        ) : filteredSeries.length > 0 ? (
        filteredSeries.map((s) => (
          <div
            key={s.id}
            className="bg-indigo-50 rounded-xl p-5 shadow-md hover:shadow-2xl hover:scale-[1.05] transition-transform cursor-pointer border border-transparent hover:border-indigo-400"
            onClick={() => handleSeriesClick(s.id, s.name)}
          >
            <img
              src={s.coverImage}
              alt={s.name}
              className="w-full h-60 object-contain rounded-md mb-2"
            />
            <h3 className="text-lg font-semibold">{s.name}</h3>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">{s.description}</p>
          </div>
        ))
        ) : (
          <p className="mt-8 text-gray-500 text-sm">没有匹配的系列。</p>
        )}
      </div>

      <footer className="mt-36 text-center text-xs text-gray-400">
        本项目仅用于课程作业和学习交流目的。项目中使用的动漫卡通形象及表情包均为其原版权所有方所有，若有侵权请联系删除。
      </footer>

    </div>
  );
}
