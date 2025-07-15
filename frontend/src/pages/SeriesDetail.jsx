import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function SeriesDetail() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const seriesName = location.state?.seriesName || '系列';

  const [boxes, setBoxes] = useState([]);
  const [rareBox, setRareBox] = useState(null);

  const rareImageMap = {
    '哪吒系列': '/series/rare-nezha.png',
    '奶龙系列': '/series/rare-nailong.png',
    '蛋黄猫系列': '/series/rare-dhm.png',
  };

  useEffect(() => {
  async function fetchUniqueBoxes() {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/boxes?seriesId=${seriesId}`);
      const allBoxes = res.data;

      // 提取所有非隐藏款
      const nonRareBoxes = allBoxes.filter(box => !box.isRare);

      // 用 description 去重，确保只取8个不同的普通款
      const uniqueBoxesMap = new Map();
      for (const box of nonRareBoxes) {
        if (!uniqueBoxesMap.has(box.description)) {
          uniqueBoxesMap.set(box.description, box);
        }
      }

      const uniqueBoxes = Array.from(uniqueBoxesMap.values()).slice(0, 8);
      const shuffled = uniqueBoxes.sort(() => Math.random() - 0.5);
        setBoxes(shuffled);

      // 提取隐藏款
      const rare = allBoxes.find(box => box.isRare);
      setRareBox(rare);

    } catch (err) {
      console.error('加载系列详情失败:', err);
    }
  }

  fetchUniqueBoxes();
}, [seriesId]);


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6" style={{ fontFamily: '"STXingkai", "华文行楷", cursive' }}>{seriesName} · 系列详情</h1>

      <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
        {boxes.map((box) => (
          <div key={box.id} className="bg-white shadow-md rounded-lg p-4">
            <img
              src={box.imageUrl}
              alt={box.name}
              className="w-full h-52 object-contain mb-2 rounded"
            />
            <p className="text-sm text-gray-500 text-center mt-1">{box.description}</p>
          </div>
        ))}
        
        {rareBox && (
          <div className="bg-white shadow-md rounded-lg p-4">
            <img
              src={rareImageMap[seriesName]}
              alt="隐藏款"
              className="w-full h-52 object-contain mb-2 rounded"
            />
            <p className="text-sm text-gray-500 text-center mt-1">隐藏款</p>
          </div>
        )}
        </div>

      <div className="flex justify-center gap-8 mt-12">
        <button
          onClick={() => navigate(`/draw/${seriesId}`, { state: { seriesName } })}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow"
        >
          抽一个
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded"
        >
          返回
        </button>
      </div>
    </div>
  );
}
