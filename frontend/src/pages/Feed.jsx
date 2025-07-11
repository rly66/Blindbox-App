import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    // 暂时复用 draw-records API 显示用户抽取列表
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/draw-records`).then(res => {
      setPosts(res.data);
    });
  }, []);

  return (
    <>
    <div className="p-6">
      <h1 className="text-4xl font-bold text-indigo-700" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.2)', fontFamily: '"STXingkai", "华文行楷", cursive' }}>玩家秀</h1>
      <div className="space-y-6">
        {posts.map((p) => (
          <div key={p.id} className="p-4 bg-white rounded shadow">
            <p className="font-medium">{p.user.username} 抽中了：</p>
            <div className="flex items-center space-x-4 mt-2">
              <img src={p.box.imageUrl} className="w-16 h-16" />
              <div>
                <p className="font-semibold">{p.box.name}</p>
                <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
