import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function MyBoxes({ user }) {
  const [myBoxes, setMyBoxes] = useState([]);

  useEffect(() => {
    const fetchMyBoxes = async () => {
      try {
        const token = localStorage.getItem('blindBoxToken');
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/my-boxes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMyBoxes(res.data);
      } catch (error) {
        console.error('加载我的盲盒失败:', error);
      }
    };

    if (user) {
      fetchMyBoxes();
    }
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-indigo-700" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>我抽到的盲盒</h1>
      <div className="grid grid-cols-3 gap-6 mt-6">
        {myBoxes.map((box) => (
          <div key={box.id} className="bg-white shadow-md rounded-lg p-10 text-center">
            <img src={box.imageUrl || '/img/icon.gif'} alt={box.boxName} className="w-32 h-40 mx-auto mb-2" />
            <h3 className="font-semibold text-lg">{box.description}</h3>
            <p className="text-sm text-indigo-600 mt-1">
              系列：
              <Link
                to={`/series/${box.seriesId}`}
                state={{ seriesId: box.seriesId, seriesName: box.seriesName }}
                className="underline hover:text-indigo-800"
              >
                {box.seriesName}
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-1">抽取时间：{new Date(box.drawTime).toLocaleString()}</p>
            {box.isRare && (
              <span className="mt-1 inline-block text-lg text-red-600 font-semibold shadow-sm rounded-full backdrop-blur border border-pink-300 bg-pink-100">🌟隐藏款🌟</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
