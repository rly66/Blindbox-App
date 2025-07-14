import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyBoxes({ user }) {
  const [myBoxes, setMyBoxes] = useState([]);

  useEffect(() => {
    const fetchMyBoxes = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/my-boxes`);
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
      <h2 className="text-4xl font-bold text-indigo-700" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>我抽到的盲盒</h2>
      <div className="grid grid-cols-3 gap-6">
        {myBoxes.map((box) => (
          <div key={box.id} className="bg-white shadow-md rounded-lg p-4 text-center">
            <img src={box.imageUrl || '/icon.gif'} alt={box.name} className="w-24 h-24 mx-auto mb-2" />
            <h3 className="font-semibold">{box.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{box.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
